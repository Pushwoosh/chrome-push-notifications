import { keyValue } from '../../storage';
import * as CONSTANTS from '../../constants';

export class Data {
  private readonly store: typeof keyValue;

  constructor(store: typeof keyValue = keyValue) {
    this.store = store;
  }

  public async clearAll(): Promise<void> {
    await this.store.set('params.applicationCode', undefined);
    await this.store.set('params.hwid', undefined);
    await this.store.set('params.deviceType', undefined);
    await this.store.set('params.deviceModel', undefined);
    await this.store.set('params.language', undefined);
    await this.store.set('params.apiEntrypoint', undefined);
    await this.store.set('params.tokens', undefined);
    await this.store.set('params.applicationServerKey', undefined);
    await this.store.set('params.senderId', undefined);
    await this.store.set('params.webSitePushId', undefined);
    await this.store.set('params.defaultNotificationImage', undefined);
    await this.store.set('params.defaultNotificationTitle', undefined);
    await this.store.set('params.userId', undefined);
    await this.store.set('params.userIdWasChanged', undefined);

    await this.store.set('params.isManualUnsubscribed', undefined);
    await this.store.set('params.isCommunicationDisabled', undefined);
    await this.store.set('params.isDropAllData', undefined);

    await this.store.set('params.sdkVersion', undefined);
    await this.store.set('params.serviceWorkerVersion', undefined);
    await this.store.set('params.serviceWorkerUrl', undefined);
    await this.store.set('params.serviceWorkerScope', undefined);

    await this.store.set('params.lastOpenMessage', undefined);
    await this.store.set('params.lastOpenApplicationTime', undefined);

    await this.store.set('params.features', undefined);

    await this.store.set('params.init', undefined);

    await this.store.set('API_PARAMS', undefined);
    await this.store.set('SENDER_ID', undefined);
    await this.store.set('COMMUNICATION_ENABLED', undefined);
    await this.store.set('DEVICE_DATA_REMOVED', undefined);
    await this.store.set('LAST_OPEN_MESSAGE', undefined);
    await this.store.set('DELAYED_EVENT', undefined);
  }

  public async setApplicationCode(application: string): Promise<void> {
    await this.store.set('params.applicationCode', application);
  }
  public async getApplicationCode(): Promise<string> {
    return await this.store.get('params.applicationCode');
  }

  public async setHwid(hwid: string): Promise<void> {
    await this.store.set('params.hwid', hwid);
  }
  public async getHwid(): Promise<string> {
    return await this.store.get('params.hwid');
  }

  public async setDeviceType(type: number): Promise<void> {
    await this.store.set('params.deviceType', type);
  }
  public async getDeviceType(): Promise<number> {
    return await this.store.get('params.deviceType');
  }

  public async setDeviceModel(model: string): Promise<void> {
    await this.store.set('params.deviceModel', model);
  }
  public async getDeviceModel(): Promise<string> {
    return await this.store.get('params.deviceModel');
  }

  public async setLanguage(language: string): Promise<void> {
    await this.store.set('params.language', language);
  }
  public async getLanguage(): Promise<string> {
    return await this.store.get('params.language', 'en');
  }

  public async setApiEntrypoint(url: string): Promise<void> {
    await this.store.set('params.apiEntrypoint', url);
  }
  public async getApiEntrypoint(): Promise<string> {
    return await this.store.get('params.apiEntrypoint', CONSTANTS.DEFAULT_API_URL);
  }

  public async setTokens(tokens: any): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    const hwid = await this.getHwid();
    await this.store.set('API_PARAMS', { hwid, ...tokens});

    // new key
    await this.store.set('params.tokens', tokens);
  }
  public async getTokens(): Promise<any> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue = await this.store.get('API_PARAMS');

    // new key
    const newValue = await this.store.get('params.tokens');

    return typeof newValue !== 'undefined' ? newValue : oldValue;
  }

  public async setApplicationServerKey(key: string): Promise<void> {
    await this.store.set('params.applicationServerKey', key);
  }
  public async getApplicationServerKey(): Promise<string | undefined> {
    return await this.store.get('params.applicationServerKey');
  }

  public async setSenderId(senderId: string): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    await this.store.set('GCM_SENDER_ID', senderId);

    // new key
    await this.store.set('params.senderId', senderId);
  }
  public async getSenderId(): Promise<string> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue = await this.store.get('GCM_SENDER_ID');

    // new key
    const newValue = await this.store.get('params.senderId');

    return typeof newValue !== 'undefined' ? newValue : oldValue;
  }

  public async setWebSitePushId(senderId: string): Promise<void> {
    await this.store.set('params.webSitePushId', senderId);
  }
  public async getWebSitePushId(): Promise<string> {
    return await this.store.get('params.webSitePushId');
  }

  public async setDefaultNotificationImage(url?: string): Promise<void> {
    await this.store.set('params.defaultNotificationImage', url);
  }
  public async getDefaultNotificationImage(): Promise<string> {
    return await this.store.get('params.defaultNotificationImage', CONSTANTS.DEFAULT_NOTIFICATION_IMAGE);
  }

  public async setDefaultNotificationTitle(text?: string): Promise<void> {
    await this.store.set('params.defaultNotificationTitle', text);
  }
  public async getDefaultNotificationTitle(): Promise<string> {
    return await this.store.get('params.defaultNotificationTitle', CONSTANTS.DEFAULT_NOTIFICATION_TITLE);
  }

  public async setUserId(userId?: string | number): Promise<void> {
    if (!userId) {
      await this.store.set('params.userId', undefined);

      return;
    }

    await this.store.set('params.userId', userId.toString());
  }
  public async getUserId(): Promise<string | undefined> {
    return await this.store.get('params.userId');
  }

  public async setStatusUserIdWasChanged(status: boolean): Promise<void> {
    await this.store.set('params.userIdWasChanged', status);
  }
  public async getStatusUserIdWasChanged(): Promise<boolean> {
    return await this.store.set('params.userIdWasChanged', false);
  }

  public async setStatusManualUnsubscribed(status: boolean): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    await this.store.set('MANUAL_UNSUBSCRIBE', status);

    // new value
    await this.store.set('params.isManualUnsubscribed', status);
  }
  public async getStatusManualUnsubscribed(): Promise<boolean> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue = await this.store.get('MANUAL_UNSUBSCRIBE', false);

    // new value
    const newValue = await this.store.get('params.isManualUnsubscribed', false);

    return typeof newValue !== 'undefined' ? newValue : oldValue;
  }

  public async setStatusCommunicationDisabled(status: boolean): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    await this.store.set('COMMUNICATION_ENABLED', status ? 0 : 1);

    // new key
    await this.store.set('params.isCommunicationDisabled', status);
  }
  public async getStatusCommunicationDisabled(): Promise<boolean> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue = await this.store.get('COMMUNICATION_ENABLED');

    // new key
    const newValue = await this.store.get('params.isCommunicationDisabled', false);

    return typeof newValue !== 'undefined' ? newValue : oldValue ! == 0;
  }

  public async setStatusDropAllData(status: boolean): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    await this.store.set('DEVICE_DATA_REMOVED', status);

    // new key
    await this.store.set('params.isDropAllData', status);
  }
  public async getStatusDropAllData(): Promise<boolean> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue =  await this.store.get('DEVICE_DATA_REMOVED', false);

    // new key
    const newValue = await this.store.get('params.isDropAllData', false);

    return typeof newValue !== 'undefined' ? newValue : oldValue;
  }

  public async setSdkVersion(version: string): Promise<void> {
    await this.store.set('params.sdkVersion', version);
  }
  public async getSdkVersion(): Promise<string> {
    return await this.store.get('params.sdkVersion');
  }

  public async setServiceWorkerVersion(version: string): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    await this.store.set('WORKER_VERSION', version);

    // new key
    await this.store.set('params.serviceWorkerVersion', version);
  }
  public async getServiceWorkerVersion(): Promise<string> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue = await this.store.get('WORKER_VERSION');

    // new key
    const newValue = await this.store.get('params.serviceWorkerVersion');

    return typeof newValue !== 'undefined' ? newValue : oldValue;
  }

  public async setServiceWorkerUrl(url?: string | null): Promise<void> {
    if (!url) {
      return;
    }

    await this.store.set('params.serviceWorkerUrl', url);
  }
  public async getServiceWorkerUrl(): Promise<string> {
    return await this.store.get('params.serviceWorkerUrl', CONSTANTS.DEFAULT_SERVICE_WORKER_URL);
  }

  public async setServiceWorkerScope(scope?: string): Promise<void> {
    if (!scope) {
      return;
    }

    await this.store.set('params.serviceWorkerScope', scope);
  }
  public async getServiceWorkerScope(): Promise<string> {
    return await this.store.get('params.serviceWorkerScope');
  }

  public async setLastOpenMessage(message: any): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    await this.store.set('LAST_OPEN_MESSAGE', message);

    // new key
    await this.store.set('params.lastOpenMessage', message);
  }
  public async getLastOpenMessage(): Promise<any> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue = await this.store.get('LAST_OPEN_MESSAGE');

    // new key
    const newValue = await this.store.get('params.lastOpenMessage');

    return typeof newValue !== 'undefined' ? newValue : oldValue;
  }

  public async setLastOpenApplicationTime(time: number): Promise<void> {
    await this.store.set('params.lastOpenApplicationTime', time);
  }
  public async getLastOpenApplicationTime(): Promise<number> {
    return await this.store.get('params.lastOpenApplicationTime');
  }

  public async setFeatures(features: any): Promise<void> {
    await this.store.set('params.features', features);
  }
  public async getFeatures(): Promise<any> {
    return await this.store.get('params.features');
  }

  public async setInitParams(params: any): Promise<any> {
    await this.store.set('params.init', params);
  }
  public async getInitParams(): Promise<any> {
    return await this.store.get('params.init');
  }

  public async setInboxLastRequestCode(lastCode: string): Promise<void> {
    await this.store.set('params.inbox.lastRequestCode', lastCode);
  }
  public async getInboxLastRequestCode(): Promise<string> {
    return await this.store.get('params.inbox.lastRequestCode', '');
  }

  public async setInboxLastRequestTime(lastRequestTime: number): Promise<void> {
    await this.store.set('params.inbox.lastRequestTime', lastRequestTime);
  }
  public async getInboxLastRequestTime(): Promise<number> {
    return this.store.get('params.inbox.lastRequestTime', 0);
  }

  public async setInboxNewMessagesCount(count: number): Promise<void> {
    await this.store.set('params.inbox.newMessagesCount', count);
  }
  public async getInboxNewMessagesCount(): Promise<number> {
    return this.store.get('params.inbox.newMessagesCount', 0);
  }

  public async setDelayedEvent(event: any): Promise<void> {
    // old key in indexed db
    // if old service worker or old sdk
    await this.store.set('DELAYED_EVENT', event);

    // new key
    await this.store.set('params.delayedEvent', event);
  }
  public async getDelayedEvent(): Promise<any> {
    // old key in indexed db
    // if old service worker or old sdk
    const oldValue = await this.store.get('DELAYED_EVENT');

    // new key
    const newValue = await this.store.get('params.delayedEvent');

    return typeof newValue !== 'undefined' ? newValue : oldValue;
  }

  public async setInApps(inApps: any): Promise<void> {
    await this.store.set('params.inApps', inApps);
  }
  public async getInApps(): Promise<any> {
    return this.store.get('params.inApps');
  }
}
