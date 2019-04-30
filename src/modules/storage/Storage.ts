import dbVersion from './version';
import MigrationExecutor from './migrations/MigrationExecutor';
import Store from './Store';


export default class Storage {
  db: Promise<IDBDatabase>;

  /**
   * Change database version handler
   * @param db
   * @param event
   */
  private dbVersionChangeHandler(db: IDBDatabase, event: IDBVersionChangeEvent) {
    console.info('onversionchange', event);
    db.close();
  }

  /**
   * Success database request handler
   * @param resolve
   * @param event
   */
  private dbRequestSuccessHandler(resolve: (db: IDBDatabase) => void, event: Event) {
    const target: IIDBOpenEventTargetWithResult = <IIDBOpenEventTargetWithResult>event.target;
    const database: IDBDatabase = target.result;

    // close db and resolve new db instance on version change
    database.onversionchange = (event: IDBVersionChangeEvent) => {
      this.dbVersionChangeHandler(database, event);
    };

    resolve(database);
  }

  /**
   * Need upgrade database version handler
   * @param event
   */
  private dbRequestUpgradeNeededHandler(event: Event) {
    const target: IIDBOpenEventTargetWithResult = <IIDBOpenEventTargetWithResult>event.target;
    const database: IDBDatabase = target.result;

    // close db and resolve new db instance on version change
    database.onversionchange = (event: IDBVersionChangeEvent) => {
      this.dbVersionChangeHandler(database, event);
    };

    // apply migrations
    const migrationExecutor = new MigrationExecutor(database);
    migrationExecutor.applyMigrations();
  }

  /**
   * Open db
   */
  getDB(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open('PUSHWOOSH_SDK_STORE', dbVersion);

      request.onsuccess = (event: Event) => {
        this.dbRequestSuccessHandler(resolve, event);  // Existing db without updates
      };
      request.onupgradeneeded = (event: Event) => {
        this.dbRequestUpgradeNeededHandler(event); // Upgrade DB
      };
      request.onerror = () => reject(request.error);  // Handle errors
    });
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
   * @param storeName
   * @param data
   * @param key
   */
  async put(storeName: TSdkStoreName, data: any, key?: string) {
    const db = await this.getDB();
    const store = new Store(db, storeName);
    const result = await store.put(data, key);
    db.close();
    return result;
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/delete
   * @param storeName
   * @param key
   */
  async delete(storeName: TSdkStoreName, key: string | number) {
    const db = await this.getDB();
    const store = new Store(db, storeName);
    const result = await store.delete(key);
    db.close();
    return result;
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/get
   * @param storeName
   * @param key
   * @param defaultValue
   */
  async get<Response, D>(
    storeName: TSdkStoreName,
    key: TIDBKeyType,
    defaultValue?: D
  ): Promise<Response | D> {
    const db = await this.getDB();
    const store = new Store(db, storeName);
    const result = await store.get<Response, D>(key, defaultValue);
    db.close();
    return result;
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/getAll
   * @param storeName
   */
  async getAll<Response>(
    storeName: TSdkStoreName,
  ): Promise<Array<Response>> {
    const db = await this.getDB();
    const store = new Store(db, storeName);
    const result = await store.getAll<Response>();
    db.close();
    return result || [];
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/count
   * @param storeName
   * @param query
   */
  async count(
    storeName: TSdkStoreName,
    query?: IDBKeyRange,
  ): Promise<number> {
    const db = await this.getDB();
    const store = new Store(db, storeName);
    const result = await store.count(query);
    db.close();
    return result;
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBIndex/count
   * @param storeName
   * @param indexName
   * @param key
   */
  async countByIndex(
    storeName: TSdkStoreName,
    indexName: string,
    key?: TIDBQueryValue,
  ): Promise<number> {
    const db = await this.getDB();
    const store = new Store(db, storeName);
    store.index = indexName;
    const result = await store.countByIndex(key);
    db.close();
    return result;
  }
}
