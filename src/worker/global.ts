import {keyValue} from '../storage';
import {
  KEY_INIT_PARAMS,
  KEY_API_PARAMS,
  KEY_LAST_OPEN_MESSAGE
} from '../constants';
import API from '../API';


export default class WorkerPushwooshGlobal {
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

  api: API;

  async initApi() {
    const values = await keyValue.getAll();
    const initParams: IInitParamsWithDefaults = values[KEY_INIT_PARAMS];
    const lastOpenMessage: TPWLastOpenMessage = values[KEY_LAST_OPEN_MESSAGE] || {};

    // TODO apiParams will be deprecated in next minor version
    const driverApiParams: TPWAPIParams = values[KEY_API_PARAMS];
    const apiParams: TPWAPIParams = {
      ...driverApiParams,
      deviceType: initParams.deviceType,
      deviceModel: initParams.tags['Device Model'],
      applicationCode: initParams.applicationCode,
      language: initParams.tags.Language,
    };
    if (initParams.userId) {
      apiParams.userId = initParams.userId
    }

    this.api = new API(apiParams, lastOpenMessage);
  }
}
