import {
  DEVICE_REGISTRATION_STATUS_REGISTERED,
  DEVICE_REGISTRATION_STATUS_UNREGISTERED,
  KEY_DEVICE_REGISTRATION_STATUS,
  KEY_INIT_PARAMS,
  KEY_API_PARAMS,
  KEY_COMMUNICATION_ENABLED,
  KEY_DEVICE_DATA_REMOVED
} from './constants';

import {
  getVersion,
  validateParams,
  sendInternalPostEvent
} from './functions';
import platformChecker from './modules/PlatformChecker';

import {keyValue} from './storage';
import Logger, {logAndThrowError} from './logger';
import doApiXHR from './modules/api/apiCall';


export default class PushwooshAPI {
  private timezone: number = -(new Date).getTimezoneOffset() * 60;
  private readonly doPushwooshApiMethod: TDoPushwooshMethod;

  constructor(private apiParams: TPWAPIParams, public lastOpenMessage: TPWLastOpenMessage) {
    this.doPushwooshApiMethod = doApiXHR;
  }

  // TODO will be deprecated in next minor version
  public get params() {
    console.error('Property "Pushwoosh.api.params" will be deprecated in next minor version. Instead, use the async method "Pushwoosh.api.getParams()"');

    sendInternalPostEvent({
      hwid: this.apiParams.hwid,
      userId: this.apiParams.userId,
      device_type: this.apiParams.deviceType,
      event: 'API Params',
      attributes: {
        app_code: this.apiParams.applicationCode,
        device_type: this.apiParams.deviceType,
        url: `${this.apiParams.applicationCode} - ${location ? location.href : 'none'}`
      }
    });

    return this.apiParams;
  }

  async getParams() {
    const {
      [KEY_API_PARAMS]: apiParams,
      [KEY_INIT_PARAMS]: initParams,
    } = await keyValue.getAll();

    return {...apiParams, ...initParams};
  }

  async callAPI(methodName: string, methodParams?: any) {
    const params: IPWParams = await this.getParams();

    // can't call any api methods if device data is removed
    const dataIsRemoved = await keyValue.get(KEY_DEVICE_DATA_REMOVED);
    if (dataIsRemoved) {
      Logger.write('error', 'Device data has been removed');
      return;
    }

    const {hwid = '', applicationCode = '', userId = ''} = params;
    if (platformChecker.isSafari && !hwid) {
      return;
    }
    const customUserId = methodParams && methodParams.userId;
    const mustBeParams: any = {
      hwid,
      application: applicationCode,
      userId: customUserId || userId || hwid,
      device_type: params.deviceType,
      v: getVersion()
    };
    return this.doPushwooshApiMethod(methodName, {
      ...methodParams,
      ...mustBeParams
    });
  }

  async registerDevice() {
    const params: IPWParams = await this.getParams();

    if (!params.pushToken || platformChecker.isSafari) {
      return;
    }

    try {
      const isCommunicationEnabled = await keyValue.get(KEY_COMMUNICATION_ENABLED) !== 0;

      if (!isCommunicationEnabled) {
        Logger.write('error', 'Communication is disabled');
        return;
      }

      await this.callAPI('registerDevice', {
          push_token: params.pushToken,
          public_key: params.publicKey,
          auth_token: params.authToken,
          fcm_token: params.fcmToken,
          fcm_push_set: params.fcmPushSet,
          language: params.tags.Language,
          timezone: this.timezone,
          device_model: params.tags['Device Model']
      });
      localStorage.setItem(KEY_DEVICE_REGISTRATION_STATUS, DEVICE_REGISTRATION_STATUS_REGISTERED);
    }
    catch (error) {
      logAndThrowError(error);
    }
  }

  async unregisterDevice() {
    if (platformChecker.isSafari) {
      return;
    }

    try {
      await this.callAPI('unregisterDevice');
      localStorage.setItem(KEY_DEVICE_REGISTRATION_STATUS, DEVICE_REGISTRATION_STATUS_UNREGISTERED);
    }
    catch (error) {
      logAndThrowError(error);
    }
  }

  async registerUser(userId?: string) {
    const params: IPWParams = await this.getParams();

    if (!params.userId && !userId) {
      return;
    }

    const methodParams = {
      timezone: this.timezone,
      userId: userId || params.userId,
    };

    await keyValue.extend(KEY_INIT_PARAMS, validateParams(methodParams));

    this.callAPI('registerUser', methodParams);
  }

  async applicationOpen() {
    const params: IPWParams = await this.getParams();
    this.callAPI('applicationOpen', {
      push_token: params.pushToken,
      timezone: this.timezone,
    });
  }

  setTags(tags: {[k: string]: any}) {
    return this.callAPI('setTags', {tags});
  }

  getTags() {
    return this.callAPI('getTags');
  }

  pushStat(hash: string) {
    return this.callAPI('pushStat', {hash});
  }

  messageDeliveryEvent(hash: string) {
    return this.callAPI('messageDeliveryEvent', {hash});
  }

  postEvent(event: string, attributes: {[k: string]: any}) {
    const {lastOpenMessage} = this;
    const date = new Date();
    const time = date.getTime();
    const timestampUTC = Math.floor(time / 1000);
    const timestampCurrent = timestampUTC - (date.getTimezoneOffset() / 60 * 3600);

    if (lastOpenMessage.expiry > Date.now()) {
      if (attributes['msgHash']) {
        return Promise.reject('attribute msgHash already defined');
      }

      attributes = {
        ...attributes,
        msgHash: lastOpenMessage.messageHash
      };
    }

    return this.callAPI('postEvent', {
      event,
      attributes,
      timestampUTC,
      timestampCurrent
    });
  }

  async triggerEvent(params: TEvent, dbKey?: string) {
      const eventFlag = dbKey ? await keyValue.get(dbKey) : null;
      if (dbKey && eventFlag) {
        return;
      }
      await this.callAPI('triggerEvent', params);
      if (dbKey) {
        keyValue.set(dbKey, 1);
      }
  }
}
