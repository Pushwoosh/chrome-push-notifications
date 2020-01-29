import { Data } from '../modules/Data/Data';
import { Api } from '../modules/Api/Api';


export default class WorkerPushwooshGlobal {
  public readonly api: Api;
  public readonly data: Data;

  constructor() {
    this.api = new Api();
    this.data = new Data();
  }

  _listeners: {[key: string]: TPWCanWaitCallback[]} = {};

  push(f: ['onPush', TPWCanWaitCallback]) {
    if (Array.isArray(f) && f[0] === 'onPush' && typeof f[1] === 'function') {
      if (!this._listeners[f[0]]) {
        this._listeners[f[0]] = []
      }
      this._listeners[f[0]].push(f[1]);
    }
  }

  getListeners(eventName: string) {
    return this._listeners[eventName] || [];
  }

  public async initApi() {
    return Promise.resolve();
  }
}
