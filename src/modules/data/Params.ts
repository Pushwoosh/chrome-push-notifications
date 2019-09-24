import {keyValue} from '../../storage';
import {
  KEY_API_PARAMS,
  DEFAULT_API_URL,
  DEFAULT_NOTIFICATION_IMAGE,
  DEFAULT_NOTIFICATION_TITLE
} from '../../constants';

import ParamsBuilder from './ParamsBuilder';


export default class Params {
  paramsBuilder: ParamsBuilder;

  constructor(paramsBuilder: ParamsBuilder = new ParamsBuilder()) {
    this.paramsBuilder = paramsBuilder;
  }

  // API url
  get apiUrl(): Promise<string> {
    return keyValue.get<TIDBApiUrlKey, string>('params.apiUrl', DEFAULT_API_URL);
  }

  async setApiUrl(apiUrl?: string): Promise<void> {
    if (!apiUrl) {
      const url = await this.paramsBuilder.buildApiUrl(this.appCode);
      return keyValue.set<TIDBApiUrlKey, string>('params.apiUrl', url);
    }
    else {
      return keyValue.set<TIDBApiUrlKey, string>('params.apiUrl', apiUrl);
    }
  }

  // Application code
  get appCode(): Promise<string> {
    return keyValue.get<TIDBAppCodeKey, string>('params.applicationCode', '');
  }

  setAppCode(appCode: string): Promise<void> {
    return keyValue.set<TIDBAppCodeKey, string>('params.applicationCode', appCode);
  }

  // Device type
  get deviceType(): Promise<string> {
    return keyValue.get<TIDBDeviceType, string>('params.deviceType', '');
  }

  // HWID
  get hwid(): Promise<string> {
    return keyValue.get<TIDBHwidKey, string>('params.hwid', '');
  }

  async setHwid(hwid: string): Promise<void> {
    const {
      [KEY_API_PARAMS]: apiParams,
    } = await keyValue.getAll();

    if (apiParams) {
      apiParams.hwid = hwid;
      await keyValue.extend(KEY_API_PARAMS, apiParams);
    }

    return keyValue.set<TIDBHwidKey, string>('params.hwid', hwid);
  }

  // Default notification image
  get defaultNotificationImage(): Promise<string> {
    return keyValue.get<TIDBDefaultNotificationImageKey, string>(
      'params.defaultNotificationImage',
      DEFAULT_NOTIFICATION_IMAGE
    );
  }

  setDefaultNotificationImage(defaultNotificationImage: string): Promise<void> {
    return keyValue.set<TIDBDefaultNotificationImageKey, string>(
      'params.defaultNotificationImage',
      defaultNotificationImage
    );
  }

  // Default notification title
  get defaultNotificationTitle(): Promise<string> {
    return keyValue.get<TIDBDefaultNotificationTitleKey, string>(
      'params.defaultNotificationTitle',
      DEFAULT_NOTIFICATION_TITLE
    );
  }

  setDefaultNotificationTitle(defaultNotificationTitle: string): Promise<void> {
    return keyValue.set<TIDBDefaultNotificationTitleKey, string>(
      'params.defaultNotificationTitle',
      defaultNotificationTitle
    );
  }


  // User id
  get userId(): Promise<string> {
    return keyValue.get<TIDBUserIdKey, string>('params.userId', '');
  }

  async setUserId(userId: string): Promise<void> {
    const oldUserId = await this.userId;
    const newUserId = userId === 'user_id' ? '' : userId;  // fix for default value

    await this.setUserIdWasChanged(oldUserId !== newUserId);  // set changed user id flag for reset userId in pushwoosh system
    return keyValue.set<TIDBUserIdKey, string>('params.userId', newUserId);
  }

  get userIdWasChanged() {
    return keyValue.get<TIDBUserIdWasChangedKey, boolean>('params.userIdWasChanged', false);
  }

  async setUserIdWasChanged(userIdWasChanged: boolean) {
    return keyValue.set<TIDBUserIdWasChangedKey, boolean>('params.userIdWasChanged', userIdWasChanged);
  }

  // Subscribe popup last open time
  get subscriptionPopupLastOpen(): Promise<number> {
    return keyValue.get<TSubscriptionPopupLastOpen, number>('params.subscriptionPopupLastOpen', 0);
  }
  async setSubscriptionPopupLastOpen(timestampWasChanged: boolean) {
    return keyValue.set<TSubscriptionPopupLastOpen, boolean>('params.subscriptionPopupLastOpen', timestampWasChanged);
  }
}
