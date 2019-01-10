import EventEmitter from './EventEmitter';
import API from './API';
import {
  getPushwooshUrl,
  getVersion,
  patchPromise,
  clearLocationHash,
  validateParams,
} from './functions';
import {PlatformChecker} from './modules/PlatformChecker';

import {
  DEFAULT_SERVICE_WORKER_URL,
  KEY_API_PARAMS,
  KEY_INIT_PARAMS,
  KEY_SDK_VERSION,
  KEY_LAST_OPEN_MESSAGE,
  KEY_LAST_SENT_APP_OPEN,
  PERIOD_SEND_APP_OPEN,
  KEY_DEVICE_REGISTRATION_STATUS,
  KEY_SAFARI_PREVIOUS_PERMISSION,
  MANUAL_SET_LOGGER_LEVEL,
  KEY_COMMUNICATION_ENABLED,
  KEY_DEVICE_DATA_REMOVED,
  KEY_UNSUBSCRIBED_DUE_TO_UNDEFINED_KEYS,

  PERMISSION_DENIED,
  PERMISSION_GRANTED,
  PERMISSION_PROMPT,

  KEY_DELAYED_EVENT,

  EVENT_GDPR_CONSENT,
  EVENT_GDPR_DELETE,

  DEVICE_REGISTRATION_STATUS_REGISTERED,
  DEVICE_REGISTRATION_STATUS_UNREGISTERED,

  EVENT_ON_READY,
  EVENT_ON_SUBSCRIBE,
  EVENT_ON_UNSUBSCRIBE,
  EVENT_ON_REGISTER,
  EVENT_ON_PERMISSION_PROMPT,
  EVENT_ON_PERMISSION_DENIED,
  EVENT_ON_PERMISSION_GRANTED,
  EVENT_ON_SW_INIT_ERROR,
  EVENT_ON_PUSH_DELIVERY,
  EVENT_ON_NOTIFICATION_CLICK,
  EVENT_ON_NOTIFICATION_CLOSE,
  EVENT_ON_CHANGE_COMMUNICATION_ENABLED,
  EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE,
  EVENT_ON_UPDATE_INBOX_MESSAGES
} from './constants';
import Logger from './logger'
import WorkerDriver from './drivers/worker';
import SafariDriver from './drivers/safari';
import {keyValue, log as logStorage, message as messageStorage} from './storage';

import Params from './modules/data/Params';
import InboxMessagesModel from './models/InboxMessages';
import InboxMessagesPublic from './modules/InboxMessagesPublic';


type ChainFunction = (param: any) => Promise<any> | any;

patchPromise();

class Pushwoosh {
  private platformChecker: PlatformChecker;
  private params: IInitParamsWithDefaults;
  private paramsModule: Params;
  private _initParams: IInitParams;
  private _ee: EventEmitter = new EventEmitter();
  private _isNeedResubscribe: boolean = false;
  private readonly _onPromises: {[key: string]: Promise<ChainFunction>};

  public api: API;
  public driver: IPWDriver;
  public permissionOnInit: string;
  public ready: boolean = false;
  public subscribeWidgetConfig: ISubscribeWidget;
  private inboxModel: InboxMessagesModel;

  // Inbox messages public interface
  public pwinbox: InboxMessagesPublic;

  constructor(
    paramsModule: Params = new Params(),
    inboxMessages: InboxMessagesModel = new InboxMessagesModel(),
    pwinbox: InboxMessagesPublic = new InboxMessagesPublic(),
    platformChecker: PlatformChecker = new PlatformChecker()
  ) {
    this.pwinbox = pwinbox;
    this.inboxModel = inboxMessages;
    this.paramsModule = paramsModule;
    this.platformChecker = platformChecker;
    this._onPromises = {};

    if (this.platformChecker.isAvailablePromise) {
      this._onPromises = {
        [EVENT_ON_PERMISSION_DENIED]: new Promise(resolve => this._ee.once(EVENT_ON_PERMISSION_DENIED, resolve)),
        [EVENT_ON_PERMISSION_PROMPT]: new Promise(resolve => this._ee.once(EVENT_ON_PERMISSION_PROMPT, resolve)),
        [EVENT_ON_PERMISSION_GRANTED]: new Promise(resolve => this._ee.once(EVENT_ON_PERMISSION_GRANTED, resolve)),
      };
    }

    // Bindings
    this.onServiceWorkerMessage = this.onServiceWorkerMessage.bind(this);
  }

  /**
   * Method that puts the stored error/info messages to browser console.
   * @type {{showLog: (() => Promise<any>); showKeyValues: (() => Promise<any>); showMessages: (() => Promise<any>)}}
   */
  public debug = {
    async showLog() {
      const items = await logStorage.getAll();
      console.log(items);
    },
    async showKeyValues() {
      const items = await keyValue.getAll();
      console.log(items);
    },
    async showMessages() {
      const items = await messageStorage.getAll();
      items.forEach((i: any) => console.log(i));
    }
  };

  /**
   * Method invoking the transmitted callback when the API is ready
   * @param cmd
   */
  onReadyHandler(cmd: HandlerFn) {
    if (this.ready) {
      cmd(this.api);
    }
    else {
      this._ee.on(EVENT_ON_READY, (params) => cmd(this.api, params));
    }
  }

  /**
   * Polymorph PW method.
   * Can get array in format [string, params | callback] or function.
   *
   *  // with callback:
   *  Pushwoosh.push(['onNotificationClick', function(api, payload) {
   *    // click on the notificationn
   *  }]);
   *
   *  // with function:
   *  Pushwoosh.push(function(api) {
   *    // this is a bit easier way to subscribe to onReady
   *  });
   *
   *  // with params:
   *  // initiates Pushwoosh service and notification subscription
   *  Pushwoosh.push(['init', {
   *    applicationCode: 'XXXXX-XXXXX',
   *    // see more about params in documentation
   *    // https://docs.pushwoosh.com/docs/web-push-sdk-30#section-integration
   *  }]);
   *
   * @param cmd
   */
  public async push(cmd: PWInput) {
    if (typeof cmd === 'function') {
      this.onReadyHandler(cmd);
    }
    else if (Array.isArray(cmd)) {
      const [cmdName, cmdFunc] = cmd;
      switch (cmdName) {
        case 'init':
          if (this.platformChecker.isAvailableNotifications) {
            if (typeof cmdFunc !== 'object') {
              break;
            }

            try {
              await this.init(cmdFunc);
            }
            catch (e) {
              Logger.write('info', 'Pushwoosh init failed', e)
            }
          }
          else {
            Logger.write('info', 'This browser does not support pushes');
          }
          break;
        case EVENT_ON_READY:
          if (typeof cmdFunc !== 'function') {
            break;
          }
          this.onReadyHandler(cmdFunc);
          break;
        case EVENT_ON_REGISTER:
        case EVENT_ON_SUBSCRIBE:
        case EVENT_ON_UNSUBSCRIBE:
        case EVENT_ON_SW_INIT_ERROR:
        case EVENT_ON_PUSH_DELIVERY:
        case EVENT_ON_NOTIFICATION_CLICK:
        case EVENT_ON_NOTIFICATION_CLOSE:
        case EVENT_ON_CHANGE_COMMUNICATION_ENABLED:
        case EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE:
        case EVENT_ON_UPDATE_INBOX_MESSAGES:
          if (typeof cmdFunc !== 'function') {
            break;
          }
          this._ee.on(cmdName, (params: any) => cmdFunc(this.api, params));
          break;
        case EVENT_ON_PERMISSION_DENIED:
        case EVENT_ON_PERMISSION_PROMPT:
        case EVENT_ON_PERMISSION_GRANTED:
          if (typeof cmdFunc !== 'function') {
            break;
          }
          this._onPromises[cmdName] && this._onPromises[cmdName].then(() => cmdFunc(this.api));
          break;
        default:
          throw new Error('unknown command');
      }
    }
    else {
      throw new Error('invalid command');
    }
  }

  /**
   * Method initiates PW services.
   * @param {IInitParams} initParams
   * @returns {Promise<void>}
   */
  private async init(initParams: IInitParams) {
    this._initParams = initParams;
    const {
      scope,
      applicationCode,
      pushwooshApiUrl,
      userId = '',
      logLevel = 'error'
    } = initParams;

    if (!applicationCode) {
      throw new Error('no application code');
    }

    const prevParams = await this.getParams();
    if (prevParams.applicationCode && prevParams.applicationCode !== applicationCode) {
      this._isNeedResubscribe = true;
    }

    // Set init params in module
    await this.paramsModule.setAppCode(applicationCode);
    await this.paramsModule.setApiUrl(pushwooshApiUrl);
    await this.paramsModule.setUserId(userId);

    // Build initial params
    const pushwooshUrl = await this.paramsModule.apiUrl;
    const params = this.params = {
      autoSubscribe: true,
      serviceWorkerUrl: null,
      pushwooshUrl,
      ...initParams,
      deviceType: this.platformChecker.platform,
      tags: {
        Language: navigator.language || 'en',
        ...initParams.tags,
        'Device Model': this.platformChecker.browserVersion,
      },
      driversSettings: {
        worker: {
          serviceWorkerUrl: DEFAULT_SERVICE_WORKER_URL,
          applicationServerPublicKey: undefined,
          ...(initParams.driversSettings && initParams.driversSettings.worker),
        }
      },
      subscribeWidget: {
        enable: false,
        ...initParams.subscribeWidget,
      }
    };
    this.subscribeWidgetConfig = params.subscribeWidget;

    // Set log level
    const manualDebug = localStorage.getItem(MANUAL_SET_LOGGER_LEVEL);
    Logger.setLevel(manualDebug || logLevel);

    // Init worker driver
    if (this.platformChecker.isAvailableServiceWorker) {
      const {worker} = params.driversSettings;
      this.driver = new WorkerDriver({
        eventEmitter: this._ee,
        scope,
        applicationCode,
        serviceWorkerUrl: params.serviceWorkerUrl,
        applicationServerPublicKey: worker.applicationServerPublicKey
      });
      try {
        if (this.driver && this.driver.initWorker) {
          await this.driver.initWorker();
        }
      }
      catch (error) {
        Logger.write('error', error, 'driver initialization failed');
      }
    }

    // Init safari driver
    else if (this.platformChecker.isSafari && params.safariWebsitePushID) {
      this.driver = new SafariDriver({
        eventEmitter: this._ee,
        applicationCode,
        pushwooshUrl,
        pushwooshApiUrl: params.pushwooshApiUrl,
        webSitePushID: params.safariWebsitePushID,
      });
      this._ee.on(EVENT_ON_READY, () => {
        const hashReg: any = /#P(.*)/;
        const hash = decodeURIComponent(document.location.hash);

        if (hashReg.test(hash)) {
          this.api
            .pushStat(hashReg.exec(hash)[1])
            .then(clearLocationHash);
        }
      });
    }
    else {
      throw new Error('can\'t initialize safari')
    }

    // Default actions on init
    try {
      await this.defaultProcess();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.onmessage = this.onServiceWorkerMessage;
      }
    }
    catch (err) {
      Logger.write('error', err, 'defaultProcess fail');
    }

    // Dispatch "pushwoosh.initialized" event
    const event = new CustomEvent('pushwoosh.initialized', {detail: {pw: this}});
    document.dispatchEvent(event);
  }

  /**
   *
   * @param {MessageEvent} event
   */
  private onServiceWorkerMessage(event: ServiceWorkerMessageEvent) {
    const {data = {}} = event || {};
    const {type = '', payload = {}} = data || {};
    this._ee.emit(type, payload);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  private async initApi() {
    const {params} = this;
    const driverApiParams = await this.driver.getAPIParams();
    const lastOpenMessage = await keyValue.get(KEY_LAST_OPEN_MESSAGE) || {};

    // TODO apiParams will be deprecated in next minor version
    const apiParams: TPWAPIParams = {
      ...driverApiParams,
      deviceType: params.deviceType,
      deviceModel: params.tags['Device Model'],
      applicationCode: params.applicationCode,
      language: params.tags.Language,
    };
    if (params.userId) {
      apiParams.userId = params.userId
    }

    await Promise.all([
      keyValue.extend(KEY_INIT_PARAMS, validateParams(this.params)),
      keyValue.extend(KEY_API_PARAMS, driverApiParams)
    ]);

    this.api = new API(apiParams, lastOpenMessage);

  }

  /**
   * Method initializes the permission dialog on the device
   * and registers through the API in case the device hasn't been registered before.
   * @returns {Promise<void>}
   */
  public async subscribe() {
    const isCommunicationEnabled = await this.isCommunicationEnabled();

    if (!isCommunicationEnabled) {
      Logger.write('error', 'Communication is disabled');
      return;
    }
    try {
      const subscribed = await this.driver.isSubscribed();

      await this.driver.askSubscribe(this.isDeviceRegistered());

      // always re-register device, because push credentials(pushToken, fcmToken, fcmPushSet) always updated
      await this.registerDuringSubscribe();

      if (!subscribed) {
        await this.onSubscribeEmitter();
      }
    }
    catch (error) {
      Logger.write('error', error, 'subscribe fail');
    }
  }

  /**
   * Registers and initializes the API.
   * @returns {Promise<void>}
   */
  private async registerDuringSubscribe() {
    const subscribed = await this.driver.isSubscribed();
    if (this.platformChecker.isSafari) {
      const force = await this.needForcedOpen();
      await this.open(force);
    }
    await this.register(subscribed);
  }

  /**
   * Emit events
   * @returns {Promise<void>}
   */
  private async onSubscribeEmitter() {
    const subscribed = await this.driver.isSubscribed();
    if (subscribed) {
      this._ee.emit(EVENT_ON_SUBSCRIBE);
    }
  }

  /**
   * Unsubscribe device.
   * @returns {Promise<void>}
   */
  public async unsubscribe(notify: boolean = true) {
    try {
      await this.driver.unsubscribe();
      await this.api.unregisterDevice();
      if (notify) {
        this._ee.emit(EVENT_ON_UNSUBSCRIBE);
      }
    }
    catch(e) {
      Logger.write('error', e, 'Error occurred during the unsubscribe');
    }
  }

  /**
   * Check device's registration status
   * @returns {boolean}
   */
  public isDeviceRegistered(): boolean {
    return localStorage.getItem(KEY_DEVICE_REGISTRATION_STATUS) === DEVICE_REGISTRATION_STATUS_REGISTERED;
  }

  public isDeviceUnregistered(): boolean {
    return localStorage.getItem(KEY_DEVICE_REGISTRATION_STATUS) === DEVICE_REGISTRATION_STATUS_UNREGISTERED;
  }

  /**
   * Check device's subscription status
   * @returns {Promise<boolean>}
   */
  public async isSubscribed(): Promise<boolean> {
    const deviceRegistration = this.platformChecker.isSafari || this.isDeviceRegistered();
    return deviceRegistration && this.driver.isSubscribed() || false;
  }

  /**
   * Registers the device and stores the information in the IndexedDB.
   * @param {boolean} forceRequests
   * @returns {Promise<void>}
   */
  private async register(forceRequests?: boolean) {
    if (!this.api) {
      throw new Error('API is not inited');
    }

    const isCommunicationEnabled = await this.isCommunicationEnabled();

    if (!isCommunicationEnabled) {
      return;
    }

    const {
      [KEY_SDK_VERSION]: savedSDKVersion,
      [KEY_API_PARAMS]: savedApiParams,
      [KEY_INIT_PARAMS]: savedInitParams
    } = await keyValue.getAll();

    const apiParams = await this.driver.getAPIParams();

    const params = this.params;

    const shouldRegister = !(
      getVersion() === savedSDKVersion &&
      JSON.stringify(savedApiParams) === JSON.stringify(apiParams) &&
      JSON.stringify(savedInitParams.tags) === JSON.stringify(params.tags)
    );

    if (shouldRegister || forceRequests) {
      await Promise.all([
        keyValue.set(KEY_API_PARAMS, apiParams),
        keyValue.extend(KEY_INIT_PARAMS, {tags: params.tags}),
        keyValue.set(KEY_SDK_VERSION, getVersion()),
      ]);
      await Promise.all([
        this.api.registerDevice(),
        this.api.setTags({...params.tags}),
        this.api.registerUser()
      ]);
      this._ee.emit(EVENT_ON_REGISTER);
    }
  }

  /**
   * Check current communication state
   * @returns {Promise<boolean>}
   */
  public async isCommunicationEnabled() {
    const isEnabled = await keyValue.get(KEY_COMMUNICATION_ENABLED);
    return isEnabled !== 0;
  }

  /**
   * Send "GDPRConsent" postEvent and depends on param "isEnabled"
   * device will be registered/unregistered from all communication channels.
   * @param {boolean} isEnabled
   * @returns {Promise<void>}
   */
  public async setCommunicationEnabled(isEnabled: boolean = true) {
    if (!this.api) {
      throw new Error('API is not inited');
    }
    const {deviceType: device_type} = await this.getParams();
    await this.api.postEvent(EVENT_GDPR_CONSENT, {channel: !!isEnabled, device_type});
    await keyValue.set(KEY_COMMUNICATION_ENABLED, isEnabled ? 1 : 0);

    this._ee.emit(EVENT_ON_CHANGE_COMMUNICATION_ENABLED, !!isEnabled);

    if (!!isEnabled) {
      return this.api.registerDevice();
    }
    else {
      return this.api.unregisterDevice();
    }
  }

  /**
   * Send "GDPRDelete" postEvent and remove all device device data from Pushwoosh.
   * @returns {Promise<void>}
   */
  public async removeAllDeviceData() {
    if (!this.api) {
      throw new Error('API is not inited');
    }
    const {deviceType: device_type} = await this.getParams();
    const currentTags = await this.api.getTags();
    const clearTags = Object.keys(currentTags.result).reduce(
      (acc: any, tagName: string) => {
        acc[tagName] = null;
        return acc;
      }, {});
    await this.api.postEvent(EVENT_GDPR_DELETE, {status: true, device_type});
    await Promise.all([
      this.api.setTags(clearTags),
      this.api.unregisterDevice()
    ]);
    return keyValue.set(KEY_DEVICE_DATA_REMOVED, 1);
  }

  /**
   * Check device's session and call the appOpen method,
   * no more than once an hour.
   * Force need to Safari await subscribe status
   * @param {boolean} force
   * @returns {Promise<void>}
   */
  private async open(force?: boolean) {
    const apiParams = await this.driver.getAPIParams();
    const curTime = Date.now();
    const val = await keyValue.get(KEY_LAST_SENT_APP_OPEN);
    const lastSentTime = isNaN(val) ? 0 : Number(val);
    if (this.platformChecker.isSafari && !apiParams.hwid) {
      return Promise.resolve();
    }
    if (force || (curTime - lastSentTime) > PERIOD_SEND_APP_OPEN) {
      await Promise.all([
        keyValue.set(KEY_LAST_SENT_APP_OPEN, curTime || Date.now()),
        this.api.applicationOpen()
      ]);
    }
  }

  /**
   * Check if device's permission status is changed and the appOpen method should be called
   * @returns {Promise<any>}
   */
  private async needForcedOpen() {
    if (!this.platformChecker.isSafari) {
      return Promise.resolve(false);
    }
    const previousPermission = await keyValue.get(KEY_SAFARI_PREVIOUS_PERMISSION);
    const currentPermission = await this.driver.getPermission();
    const compare = (prev: string, curr: string) => prev !== PERMISSION_GRANTED && curr === PERMISSION_GRANTED;
    await keyValue.set(KEY_SAFARI_PREVIOUS_PERMISSION, currentPermission);
    const result = compare(this.permissionOnInit, currentPermission) || compare(previousPermission, currentPermission);
    return Promise.resolve(result);
  }

  /**
   * Default process during PW initialization.
   * Init API. Subscription to notifications.
   * Emit delayed events.
   * @returns {Promise<void>}
   */
  private async defaultProcess() {
    const {autoSubscribe = true} = this.params || {};
    this.permissionOnInit = await this.driver.getPermission();

    await this.initApi();
    await this.open();
    await this.inboxModel.updateMessages(this._ee);

    if (this.driver.isNeedUnsubscribe) {
      const needUnsubscribe = await this.driver.isNeedUnsubscribe() && this.isDeviceRegistered();
      if (needUnsubscribe) {
        await this.unsubscribe(false);
        await keyValue.set(KEY_UNSUBSCRIBED_DUE_TO_UNDEFINED_KEYS, true);
      }

    }

    if (this._isNeedResubscribe) {
      await this.unsubscribe(false);
    }

    // can't call any api methods if device data is removed
    const dataIsRemoved = await keyValue.get(KEY_DEVICE_DATA_REMOVED);
    if (dataIsRemoved) {
      Logger.write('error', 'Device data has been removed');
      return;
    }

    // Actions depending of the permissions
    switch (this.permissionOnInit) {
      case PERMISSION_DENIED:
        this._ee.emit(EVENT_ON_PERMISSION_DENIED);
        // if permission === PERMISSION_DENIED and device is registered do unsubscribe (unregister device)
        if (!this.platformChecker.isSafari && this.isDeviceRegistered()) {
          await this.unsubscribe();
        }
        localStorage.removeItem(KEY_DEVICE_REGISTRATION_STATUS);
        break;
      case PERMISSION_PROMPT:
        // if permission === PERMISSION_PROMPT and device is registered do unsubscribe (unregister device)
        if (!this.platformChecker.isSafari && this.isDeviceRegistered()) {
          await this.unsubscribe();
        }
        localStorage.removeItem(KEY_DEVICE_REGISTRATION_STATUS);
        if (autoSubscribe) {
          await this.subscribe();
        } else {
          this._ee.emit(EVENT_ON_PERMISSION_PROMPT);
        }
        break;
      case PERMISSION_GRANTED:
        this._ee.emit(EVENT_ON_PERMISSION_GRANTED);
        const trySubscribe = await keyValue.get(KEY_UNSUBSCRIBED_DUE_TO_UNDEFINED_KEYS); // try subscribe if unsubscribed due to undefined fcm keys PUSH-16049
        // if permission === PERMISSION_GRANTED and device is not registered do subscribe
        if ((!this.platformChecker.isSafari && !this.isDeviceRegistered() && !this.isDeviceUnregistered()) || this._isNeedResubscribe || trySubscribe) {
          await this.subscribe();
          await keyValue.set(KEY_UNSUBSCRIBED_DUE_TO_UNDEFINED_KEYS, false);
        }
        break;
      default:
        Logger.write('error', this.permissionOnInit, 'unknown permission value');
    }

    await this.initApi();
    await this.register();

    // Safari await subscribe status
    const force = await this.needForcedOpen();
    if (force) {
      await this.open(true);
    }

    this._ee.emit(EVENT_ON_READY);
    this.ready = true;

    const delayedEvent = await keyValue.get(KEY_DELAYED_EVENT);
    if (delayedEvent) {
      const {type, payload} = delayedEvent;
      await this._ee.emit(type, payload);
      await keyValue.set(KEY_DELAYED_EVENT, null);
    }
  }

  /**
   * Method returns hardware id.
   * @returns {Promise<string>}
   */
  public async getHWID() {
    const {hwid} = await this.driver.getAPIParams();
    return Promise.resolve(hwid);
  }

  /**
   * Method returns push token.
   * @returns {Promise<string>}
   */
  async getPushToken() {
    const {pushToken} = await this.driver.getAPIParams();
    return Promise.resolve(pushToken);
  }

  /**
   * Method returns userId
   * @returns {Promise<string | null>}
   */
  async getUserId() {
    const {userId}: IPWParams = await this.getParams();
    return userId || this.params.userId || null;
  }

  /**
   * Method returns an object with all params.
   * @returns {Promise<IPWParams>}
   */
  public async getParams() {
    const {
      [KEY_API_PARAMS]: apiParams,
      [KEY_INIT_PARAMS]: initParams,
    } = await keyValue.getAll();

    return {...apiParams, ...initParams};
  }
}

export default Pushwoosh;
