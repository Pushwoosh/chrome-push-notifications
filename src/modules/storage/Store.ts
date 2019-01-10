export default class Store {
  private readonly name: TSdkStoreName;
  private store: IDBObjectStore;
  private _index: IDBIndex;

  constructor(
    db: IDBDatabase,
    name: TSdkStoreName,
  ) {
    this.name = name;
    this.store = db.transaction(this.name, 'readwrite').objectStore(this.name);
  }

  set index(index: string) {
    const indexNames = this.store.indexNames;
    if (indexNames.contains(index)) {
      this._index = this.store.index(index);
    }
    else {
      console.warn(`Index "${index}" in `)
    }
  }

  private writeRequestPromise<T>(request: IDBRequest, result?: T): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private readRequestPromise<Response, D>(request: IDBRequest, defaultValue?: D): Promise<Response | D> {
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const target: IIDBGetTransactionEventTargetWithResult = <IIDBGetTransactionEventTargetWithResult>event.target;
        resolve(<Response>target.result || defaultValue);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  put(data: any, key?: TIDBKeyType): Promise<TIDBKeyType> {
    const request = this.store.put(data, key);
    return this.writeRequestPromise<TIDBKeyType>(request, key);
  }

  /**
   * Fallback for old interface
   * @param data
   * @param key
   */
  add(data: any, key?: string): Promise<TIDBKeyType> {
    return this.put(data, key);
  }

  delete(key: TIDBKeyType): Promise<void> {
    const request = this.store.delete(key);
    return this.writeRequestPromise(request);
  }

  get<Response, D>(key: TIDBKeyType, defaultValue?: D) {
    const request = this.store.get(key);
    return this.readRequestPromise<Response, D>(request, defaultValue);
  }

  getAll<Response, D>(query?: TIDBQueryValue, defaultValue?: D) {
    const request = this.store.getAll(query);
    return this.readRequestPromise<Response, D>(request, defaultValue);
  }

  count(query?: IDBKeyRange): Promise<number> {
    const request = this.store.count(query);
    return this.readRequestPromise<number, number>(request, 0);
  }

  getAllByIndex<Response, D>(value: TIDBQueryValue, defaultValue?: D): Promise<Response | D> {
    const request = this._index.getAll(value);
    return this.readRequestPromise<Response, D>(request, defaultValue);
  }

  countByIndex(key?: TIDBQueryValue) {
    const request = this._index.count(key);
    return this.readRequestPromise<number, number>(request, 0);
  }
}
