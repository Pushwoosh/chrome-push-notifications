import version from './modules/storage/version';
import MigrationExecutor from './modules/storage/migrations/MigrationExecutor';
import {
  STORE_NAME_KEY_VALUE,
  STORE_NAME_MAIN_LOG,
  STORE_NAME_MESSAGE_LOG
} from './modules/storage/migrations/constants';


function onversionchange(database: IDBDatabase, event: Event) {
  console.info('onversionchange', event);
  database.close();
}

let databasePromise: Promise<IDBDatabase>;
export function getInstance(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open('PUSHWOOSH_SDK_STORE', version);
      request.onsuccess = (event) => {
        const database: IDBDatabase = (event.target as IIDBOpenEventTargetWithResult).result;
        database.onversionchange = onversionchange.bind(null, database, reject);
        resolve(database);
      };

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const database: IDBDatabase = (event.target as IIDBOpenEventTargetWithResult).result;
        database.onversionchange = onversionchange.bind(null, database, reject);

        const migrationExecutor = new MigrationExecutor(database);
        migrationExecutor.applyMigrations();
      };
    });
  }
  return databasePromise;
}

function getInstanceWithPromise(executor: any): any {
  return getInstance().then(database => (
    new Promise((resolve, reject) => executor(database, resolve, reject))
  ));
}

function createKeyValue(name: string) {
  return {
    get<K extends string, D>(key: K, defaultValue?: D) {
      return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
        const request = database.transaction(name).objectStore(name).get(key);

        /** @TODO
         * we cant invoke "resolve" or "reject" in onsuccess or onerror because
         * it leads to bugs in Safari when we try to get permissions for notifications
         *
         * Checking status of request in setTimeout fixes this bug
         */
        let isComplete = false;
        let isError = false;
        let timeout: any;

        const check = () => {
          clearTimeout(timeout);
          if (isComplete) {
            const {result} = request;
            resolve(result && result.value || defaultValue);
          } else if (isError) {
            reject(request.error);
          } else {
            timeout = setTimeout(check, 0);
          }
        };

        request.onsuccess = () => isComplete = true;
        request.onerror = () => isError = true;
        check();
      });
    },

    getAll() {
      return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
        const result: {[key: string]: any} = {};
        const cursor = database.transaction(name).objectStore(name).openCursor();
        let isComplete = false;
        let isError = false;
        let timeout: any;

        /** @TODO
         * we cant invoke "resolve" or "reject" in onsuccess or onerror because
         * it leads to bugs in Safari when we try to get permissions for notifications
         *
         * Checking status of request in setTimeout fixes this bug
         */
        const check = () => {
          clearTimeout(timeout);
          if (isComplete) {
            resolve(result);
          } else if (isError) {
            reject(cursor.error);
          } else {
            timeout = setTimeout(check, 0);
          }
        };

        cursor.onsuccess = (event) => {
          const cursorResult = (event.target as any).result;
          if (cursorResult) {
            result[cursorResult.key] = cursorResult.value.value;
            cursorResult.continue();
          } else {
            isComplete = true;
          }
        };
        cursor.onerror = () => isError = true;
        check();
      });
    },

    async extend(key: string, value: any) {
      const oldValues = await this.get(key);
      const {...newValues} = value;
      await this.set(key, {...oldValues, ...newValues});
    },

    set<K, D>(key: K, value: D) {
      return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
        const request = database.transaction([name], 'readwrite').objectStore(name).put({key, value});
        let isComplete = false;
        let isError = false;
        let timeout: any;

        /** @TODO
         * we cant invoke "resolve" or "reject" in onsuccess or onerror because
         * it leads to bugs in Safari when we try to get permissions for notifications
         *
         * Checking status of request in setTimeout fixes this bug
         */
        const check = () => {
          clearTimeout(timeout);
          if (isComplete) {
            resolve(key);
          } else if (isError) {
            reject(request.error);
          } else {
            timeout = setTimeout(check, 0);
          }
        };

        request.onsuccess = () => isComplete = true;
        request.onerror = () => isError = true;
        check();
      });
    }
  };
}


export abstract class LogBase {
  protected abstract name: string;
  protected abstract maxItems: number;
  _add(obj: any) {
    return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
      const request = database.transaction([this.name], 'readwrite').objectStore(this.name).add(obj);
      request.onsuccess = () => {
        resolve(obj);
      };
      request.onerror = () => {
        reject(request.error);
      };
    }).then((obj: any) => {
      return this.getAll().then((items: {id: number}[]) => {
        if (Array.isArray(items)) {
          const ids = items.map(i => i.id).sort((a, b) => {
            if (a == b) return 0;
            return a < b ? 1 : -1;
          });
          if (ids.length > this.maxItems) {
            return Promise.all(ids.slice(this.maxItems).map(id => this.delete(id))).then(() => obj)
          }
        }
        return obj;
      });
    });
  }

  delete(key: any) {
    return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
      const request = database.transaction([this.name], 'readwrite').objectStore(this.name).delete(key);
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  getAll() {
    return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
      const result: any[] = [];
      const cursor = database.transaction(this.name).objectStore(this.name).openCursor();
      cursor.onsuccess = (ev) => {
        const cursorResult = (ev.target as any).result;
        if (cursorResult) {
          if(cursorResult.value) {
            result.push(cursorResult.value);
          }
          cursorResult.continue();
        }
        else {
          resolve(result);
        }
      };
      cursor.onerror = () => {
        reject(cursor.error);
      };
    });
  }
}

export class LogLog extends LogBase {
  protected name = STORE_NAME_MAIN_LOG;
  protected maxItems = 100;
  protected environment = (typeof self !== 'undefined' && (self as ServiceWorkerGlobalScope).registration) ? 'worker' : 'browser';
  add(type: string, message: any, additional?: any) {
    const obj: any = {
      type,
      environment: this.environment,
      message: `${message}`,
      date: new Date
    };
    if (message instanceof Error) {
      obj.stack = message.stack;
    }
    if (additional) {
      obj.additional = additional;
    }
    return this._add(obj);
  }
}

export class LogMessage extends LogBase {
  protected name = STORE_NAME_MESSAGE_LOG;
  protected maxItems = 25;
  add(log: any) {
    return this._add({
      ...log,
      date: new Date
    });
  }
}

export const keyValue = createKeyValue(STORE_NAME_KEY_VALUE);
export const log = new LogLog();
export const message = new LogMessage();
