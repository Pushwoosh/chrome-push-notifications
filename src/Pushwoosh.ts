import { v4 } from 'uuid';

import { Api } from './modules/Api/Api';
import { Data } from './modules/Data/Data';
import { ApiClient } from './modules/ApiClient/ApiClient';
import { PushServiceDefault, PushServiceSafari } from './services/PushService/PushService';
import { Popup } from './features/Popup/Popup';
import { SubscriptionPopupWidget } from './features/SubscriptionSegmentsWidget/SubscriptionSegmentsWidget';

import * as CONSTANTS from './constants';

import EventEmitter from './EventEmitter';
import {clearLocationHash, patchPromise} from './functions';
import {PlatformChecker} from './modules/PlatformChecker';

import { Logger } from './logger'
import FacebookModule from './modules/FacebookModule';
import {InApps} from './modules/InApps/InApps';
import {keyValue, log as logStorage, message as messageStorage} from './storage';

import InboxMessagesModel from './models/InboxMessages';
import InboxMessagesPublic from './modules/InboxMessagesPublic';
import {EventBus, TEvents} from './modules/EventBus/EventBus';
import {CommandBus, TCommands} from './modules/CommandBus/CommandBus';

import { IPushService } from './services/PushService/PushService.types';

type ChainFunction = (param: any) => Promise<any> | any;

patchPromise();

export default class Pushwoosh {
  private readonly data: Data;
  private readonly apiClient: ApiClient;

  private isCommunicationDisabled?: boolean;

  public readonly api: Api;
  public readonly subscriptionSegmentWidget: SubscriptionPopupWidget;

  public driver: IPushService;


  private platformChecker: PlatformChecker;
  private _ee: EventEmitter = new EventEmitter();
  private readonly _onPromises: { [key: string]: Promise<ChainFunction> };
  private readonly eventBus: EventBus;
  private readonly commandBus: CommandBus;

  public ready: boolean = false;
  public subscribeWidgetConfig: ISubscribeWidget;
  public inboxWidgetConfig: IInboxWidget;
  public subscribePopupConfig: any;
  public InApps: InApps;

  // Inbox messages public interface
  public pwinbox: InboxMessagesPublic;
  private inboxModel: InboxMessagesModel;

  constructor(
    platformChecker: PlatformChecker = new PlatformChecker()
  ) {
    this.data = new Data();

    this.commandBus = CommandBus.getInstance();
    this.eventBus = EventBus.getInstance();

    this.apiClient = new ApiClient(this.data);
    this.api = new Api(this.data, this.apiClient, this.commandBus, this.eventBus, this._ee);


    this.inboxModel = new InboxMessagesModel(this.data, this.api);
    this.pwinbox = new InboxMessagesPublic(this.data, this.api, this.inboxModel);

    this.platformChecker = platformChecker;
    this._onPromises = {};

    if (this.platformChecker.isAvailablePromise) {
      this._onPromises = {
        [CONSTANTS.EVENT_ON_PERMISSION_DENIED]: new Promise(resolve => this._ee.once(CONSTANTS.EVENT_ON_PERMISSION_DENIED, resolve)),
        [CONSTANTS.EVENT_ON_PERMISSION_PROMPT]: new Promise(resolve => this._ee.once(CONSTANTS.EVENT_ON_PERMISSION_PROMPT, resolve)),
        [CONSTANTS.EVENT_ON_PERMISSION_GRANTED]: new Promise(resolve => this._ee.once(CONSTANTS.EVENT_ON_PERMISSION_GRANTED, resolve)),
      };
    }

    // Bindings
    this.onServiceWorkerMessage = this.onServiceWorkerMessage.bind(this);


    // subscribe by connector
    this.commandBus.on(TCommands.SUBSCRIBE, ({ commandId }) => {
      this.subscribe()
        .then(() => {
          this.eventBus.emit(TEvents.SUBSCRIBE, commandId);
        });
    });

    // unsubscribe by connector
    this.commandBus.on(TCommands.UNSUBSCRIBE, ({ commandId }) => {
      this.unsubscribe()
        .then(() => {
          this.eventBus.emit(TEvents.UNSUBSCRIBE, commandId);
        });
    });

    // check subscribe status by connector
    this.commandBus.on(TCommands.CHECK_IS_SUBSCRIBED, ({ commandId }) => {
      this.api.checkDeviceSubscribeForPushNotifications(false)
        .then((state) => {
          this.eventBus.emit(TEvents.CHECK_IS_SUBSCRIBED, { state: state }, commandId);
        });
    });

    // check subscribe status by connector
    this.commandBus.on(TCommands.CHECK_IS_MANUAL_UNSUBSCRIBED, ({ commandId }) => {
      this.data.getStatusManualUnsubscribed()
        .then((state: boolean) => {
          this.eventBus.emit(TEvents.CHECK_IS_MANUAL_UNSUBSCRIBED, { state: state }, commandId);
        });
    });

    const popup = new Popup('subscription-segments');
    // need inject this because need call subscribe method
    // can't use command bus, because need call synchronically
    this.subscriptionSegmentWidget = new SubscriptionPopupWidget(this.data, this.apiClient, this.api, popup, this);
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
   * @param command
   */
  public push(command: PWInput) {
    if (typeof command === 'function') {
      this.handleOnReadyCallback(command);

      return;
    }

    if (!Array.isArray(command)) {
      throw new Error('Invalid command!');
    }

    switch (command[0]) {
      case 'init':
        this.initialize(command[1]);

        break;

      case CONSTANTS.EVENT_ON_READY:
        this.handleOnReadyCallback(command[1]);
        break;

      case CONSTANTS.EVENT_ON_REGISTER:
      case CONSTANTS.EVENT_ON_SUBSCRIBE:
      case CONSTANTS.EVENT_ON_UNSUBSCRIBE:
      case CONSTANTS.EVENT_ON_SW_INIT_ERROR:
      case CONSTANTS.EVENT_ON_PUSH_DELIVERY:
      case CONSTANTS.EVENT_ON_NOTIFICATION_CLICK:
      case CONSTANTS.EVENT_ON_NOTIFICATION_CLOSE:
      case CONSTANTS.EVENT_ON_CHANGE_COMMUNICATION_ENABLED:
      case CONSTANTS.EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE:
      case CONSTANTS.EVENT_ON_UPDATE_INBOX_MESSAGES:
      case CONSTANTS.EVENT_ON_SHOW_NOTIFICATION_PERMISSION_DIALOG:
      case CONSTANTS.EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG:
        this.handleEventCallback(command[0], command[1]);

        break;

      case CONSTANTS.EVENT_ON_PERMISSION_DENIED:
      case CONSTANTS.EVENT_ON_PERMISSION_PROMPT:
      case CONSTANTS.EVENT_ON_PERMISSION_GRANTED:
        this.handleOnChangePermissionCallback(command[0], command[1]);
        break;

      default:
        throw new Error('Unknown command!');
    }
  }

  /**
   * Method initializes the permission dialog on the device
   * and registers through the API in case the device hasn't been registered before.
   * @returns {Promise<void>}
   */
  public async subscribe(isForceSubscribe = true): Promise<void> {
    if (this.isCommunicationDisabled) {
      Logger.error('Communication is disabled!');
    }

    const isPermissionDefault = this.driver.checkIsPermissionDefault();

    // if permission granted need ask permission for send notifications
    if (isPermissionDefault) {
      // emit event when permission dialog show
      this._ee.emit(CONSTANTS.EVENT_ON_SHOW_NOTIFICATION_PERMISSION_DIALOG);
      this.eventBus.emit(TEvents.SHOW_NOTIFICATION_PERMISSION_DIALOG);

      // all action before this MUST be a synchrony because
      // in new release in ff 72 we must call this event by user
      // ask permission
      // ask permissions only show prompt window, not register device for send push notifications
      await this.driver.askPermission();

      const permission = this.driver.getPermission();

      // emit event when permission dialog hide with permission state
      this._ee.emit(CONSTANTS.EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG, permission);
      this.eventBus.emit(TEvents.HIDE_NOTIFICATION_PERMISSION_DIALOG);
    }

    const permission = this.driver.getPermission();
    const isManualUnsubscribed = await this.data.getStatusManualUnsubscribed();
    const isDeviceRegister = await this.driver.checkIsRegister();

    // if permission granted emit event and register device into pushwoosh
    if (permission === CONSTANTS.PERMISSION_GRANTED) {
      this._ee.emit(CONSTANTS.EVENT_ON_PERMISSION_GRANTED);
      const needSubscribe = isForceSubscribe || !isManualUnsubscribed;

      this._ee.emit(CONSTANTS.EVENT_ON_SUBSCRIBE);

      if (needSubscribe && !isDeviceRegister) {
        await this.driver.subscribe();
      }

      return;
    }

    // if permission denied emit event
    if (permission === CONSTANTS.PERMISSION_DENIED) {
      this._ee.emit(CONSTANTS.EVENT_ON_PERMISSION_DENIED);

      if (isDeviceRegister) {
        await this.driver.unsubscribe();
      }

      return;
    }
  }

  /**
   * Unsubscribe device.
   * @returns {Promise<void>}
   */
  public async unsubscribe() {
    try {
      await this.driver.unsubscribe();
    } catch (error) {
      Logger.error(error, 'Error occurred during the unsubscribe');
    }
  }

  /**
   * force subscribe if there was a manual unsubscribe
   * @returns {Promise<void>}
   */
  public async forceSubscribe() {
    await this.subscribe(true);
  }

  /**
   * Check device's registration status
   * @returns {boolean}
   */
  public isDeviceRegistered(): boolean {
    return localStorage.getItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS) === CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED;
  }

  public isDeviceUnregistered(): boolean {
    return localStorage.getItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS) === CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED;
  }

  /**
   * Check device's subscription status
   * @returns {Promise<boolean>}
   */
  public async isSubscribed(): Promise<boolean> {
    return this.api.checkDeviceSubscribeForPushNotifications();
  }

  /**
   * Check current communication state
   * @returns {Promise<boolean>}
   */
  public async isCommunicationEnabled() {
    const isCommunicationDisabled = await this.data.getStatusCommunicationDisabled();

    return !isCommunicationDisabled;
  }

  /**
   * Send "GDPRConsent" postEvent and depends on param "isEnabled"
   * device will be registered/unregistered from all communication channels.
   * @param {boolean} isEnabled
   * @returns {Promise<void>}
   */
  public async setCommunicationEnabled(isEnabled: boolean = true) {
    const deviceType = await this.data.getDeviceType();
    const isPermissionGranted = this.driver.checkIsPermissionGranted();

    await this.data.setStatusCommunicationDisabled(!isEnabled);

    if (isEnabled) {
      await this.data.setStatusDropAllData(false);
      if (isPermissionGranted) {
        await this.api.registerDevice();
      }
    } else {
      await this.api.unregisterDevice();
    }

    this._ee.emit(CONSTANTS.EVENT_ON_CHANGE_COMMUNICATION_ENABLED, isEnabled);

    await this.api.postEvent(CONSTANTS.EVENT_GDPR_CONSENT, {
      channel: isEnabled,
      device_type: deviceType,
    });
  }

  /**
   * Send "GDPRDelete" postEvent and remove all device device data from Pushwoosh.
   * @returns {Promise<void>}
   */
  public async removeAllDeviceData() {
    const deviceType = await this.data.getDeviceType();

    await this.api.postEvent(CONSTANTS.EVENT_GDPR_DELETE, {
      status: true,
      device_type: deviceType
    });

    await this.api.deleteDevice();
    await this.data.clearAll();

    await this.data.setStatusDropAllData(true);
  }

  /**
   * Method returns hardware id.
   * @returns {Promise<string>}
   */
  public async getHWID(): Promise<string> {
    return await this.data.getHwid();
  }

  /**
   * Method returns push token.
   * @returns {Promise<string>}
   */
  public async getPushToken(): Promise<string | undefined> {
    const { pushToken } = await this.data.getTokens();

    return pushToken;
  }

  /**
   * Method returns userId
   * @returns {Promise<string | null>}
   */
  public async getUserId(): Promise<string | undefined> {
    return await this.data.getUserId();
  }

  /**
   * Method returns an object with all params.
   * @returns {Promise<IPWParams>}
   */
  public async getParams() {
    return await this.api.getParams();
  }

  /**
   * Method returns  true if notifications available.
   * @returns {boolean}
   */
  public isAvailableNotifications() {
    return this.platformChecker.isAvailableNotifications;
  }

  public async sendStatisticsVisitedPage() {
    const {
      document: { title },
      location: { origin, pathname, href }
    } = window;

    await this.api.pageVisit({
      title,
      url_path: `${origin}${pathname}`,
      url: href
    });
  }

  public async isEnableChannels(): Promise<boolean> {
    const channels: unknown = await keyValue.get(CONSTANTS.CHANNELS);

    return Array.isArray(channels) && !!channels.length;
  }

  private async initialize(params: IInitParams) {
    // step 0: set logger configuration
    const manualDebug = localStorage.getItem(CONSTANTS.MANUAL_SET_LOGGER_LEVEL);
    Logger.setLevel(manualDebug || params.logLevel || 'error');

    // step 1: check application code
    const applicationCode = await this.data.getApplicationCode();

    if (!params.applicationCode) {
      throw new Error('Can\'t find application code!');
    }

    const notSavedApplicationCode = !applicationCode;
    const isChangeApplicationCode = applicationCode && applicationCode !== params.applicationCode;

    // if have not old application code or application code was change => remove all info about init params and subscription
    if (notSavedApplicationCode || isChangeApplicationCode) {
      await this.data.clearAll();
      await this.data.setApplicationCode(params.applicationCode);
    }

    // step 2: check hwid
    const hwid = await this.data.getHwid();

    if (!hwid) {
      const id = params.applicationCode + '_' + v4();

      await this.data.setHwid(id);
    } else {
      await this.api.checkDevice();
    }

    // step 3: check user id
    const userIdWasChange = await this.data.getStatusUserIdWasChanged();

    if (!userIdWasChange) {
      await this.data.setUserId(params.userId);
    }

    // step 4: add info about platform
    await this.data.setDeviceType(this.platformChecker.getPlatformType());
    await this.data.setDeviceModel(this.platformChecker.getBrowserVersion());
    await this.data.setLanguage(params.tags && params.tags.Language || navigator.language);

    // step 5: set configuration info
    if (params.pushwooshUrl) {
      await this.data.setApiEntrypoint(params.pushwooshUrl);
    }

    await this.data.setSdkVersion(__VERSION__);

    this.subscribeWidgetConfig = {
      enable: false,
      ...params.subscribeWidget
    };

    this.inboxWidgetConfig = {
      enable: false,
      ...params.inboxWidget
    };

    this.subscribePopupConfig = {
      enable: false,
      ...params.subscribePopup
    };

    // step 6: check communication disabled
    this.isCommunicationDisabled = await this.data.getStatusCommunicationDisabled();

    await this.open();

    // step 7: init submodules module in app (need before push notification because in apps use in subscription segments widget)
    await this.initInApp(params);

    // step 8: init push notification
    if (this.platformChecker.isAvailableNotifications) {
      await this.initPushNotifications(params);
    }

    // step 9: init submodules (inbox, facebook)
    await this.inboxModel.updateMessages(this._ee);
    await this.initFacebook(params);

    // step 10: ready
    this._ee.emit(CONSTANTS.EVENT_ON_READY);
    this.ready = true;

    const delayedEvent = await this.data.getDelayedEvent();

    if (delayedEvent) {
      const { type, payload } = delayedEvent;
      await this._ee.emit(type, payload);
      await keyValue.set(CONSTANTS.KEY_DELAYED_EVENT, null);
    }

    if ('serviceWorker' in navigator) {
      // @ts-ignore
      navigator.serviceWorker.onmessage = this.onServiceWorkerMessage;
    }

    localStorage.setItem('pushwoosh-websdk-status', 'init');

    // Dispatch 'pushwoosh.initialized' event
    document.dispatchEvent(new CustomEvent('pushwoosh.initialized', {
      detail: {
        pw: this
      }
    }));

    // send push stat only in safari, because safari haven't service worker
    // in other browsers stat will be send in service worker
    if (this.platformChecker.isSafari) {
      this._ee.on(CONSTANTS.EVENT_ON_READY, () => {
        const hashReg: any = /#P(.*)/;
        const hash = decodeURIComponent(document.location.hash);

        if (hashReg.test(hash)) {
          this.api
            .pushStat(hashReg.exec(hash)[1])
            .then(clearLocationHash);
        }
      });
    }
  }

  /**
   * Default process during PW initialization.
   * Init API. Subscription to notifications.
   * Emit delayed events.
   * @returns {Promise<void>}
   */
  private async defaultProcess(initParams: IInitParams) {
    const isRegister = await this.api.checkDeviceSubscribeForPushNotifications();
    const isCommunicationDisabled = await this.data.getStatusCommunicationDisabled();
    const isDropAllData = await this.data.getStatusDropAllData();
    const isNeedResubscribe = await this.driver.checkIsNeedResubscribe();
    const isAvailableSubscriptionSegments = await this.isEnableChannels();

    if (isCommunicationDisabled || isDropAllData) {
      await this.unsubscribe();

      return;
    }

    if (isNeedResubscribe) {
      await this.unsubscribe();
      await this.data.setStatusManualUnsubscribed(false);
    }

    const { autoSubscribe } = initParams;
    const permission = this.driver.getPermission();
    const isManualUnsubscribed = await this.data.getStatusManualUnsubscribed();

    // Actions depending of the permissions
    switch (permission) {
      case CONSTANTS.PERMISSION_PROMPT:
        // emit event permission default
        this._ee.emit(CONSTANTS.EVENT_ON_PERMISSION_PROMPT);

        // device can't be register if permission default
        if (isRegister) {
          await this.unsubscribe();
        }

        // method subscribe need user click
        if (autoSubscribe && !isAvailableSubscriptionSegments) {
          console.warn('Option autoSubscribe have been deprecated. Please use "Push Subscription Button" or "Custom Subscription Popup"');

          this.subscribe();
        }

        // show subscription segment widget
        if (autoSubscribe && isAvailableSubscriptionSegments) {
          await this.subscriptionSegmentWidget.init();

          this.subscriptionSegmentWidget.showPopup();
        }

        break;

      case CONSTANTS.PERMISSION_DENIED:
        // emit event permission denied
        this._ee.emit(CONSTANTS.EVENT_ON_PERMISSION_DENIED);

        // device can't be register if permission default
        if (isRegister) {
          await this.unsubscribe();
        }

        break;
      case CONSTANTS.PERMISSION_GRANTED:
        // emit event permission granted
        this._ee.emit(CONSTANTS.EVENT_ON_PERMISSION_GRANTED);

        // device can't be register if manual unsubscribed
        if (isManualUnsubscribed && isRegister) {
          await this.unsubscribe();
        }

        // device must be register if not manual unsubscribed
        // or if change configuration -> resubscribe device for get new push token
        if (!isRegister && !isManualUnsubscribed || isNeedResubscribe) {
          await this.subscribe();
        }

        break;
    }
  }

  /**
   * Method invoking the transmitted callback when the API is ready
   * @param cmd
   */
  private onReadyHandler(cmd: HandlerFn) {
    if (this.ready) {
      cmd(this.api);
    } else {
      this._ee.on(CONSTANTS.EVENT_ON_READY, (params) => cmd(this.api, params));
    }
  }

  private handleOnReadyCallback(callback: PushOnReadyCallback) {
    this.onReadyHandler(callback);
  }

  private handleOnChangePermissionCallback(name: PWEvent, callback: HandlerFn) {
    const currentPromise = this._onPromises[name];

    if (!currentPromise) {
      return;
    }

    currentPromise
      .then(() => {
        return callback(this.api);
      });
  }

  private handleEventCallback(name: PWEvent, callback: HandlerFn) {
    this._ee.on(name, (params: any) => {
      return callback(this.api, params);
    });
  }

  /**
   * Method initiates Facebook
   * @param {IInitParams} initParams
   * @returns {Promise<void>}
   */
  private initFacebook(initParams: IInitParams) {
    const facebook = {
      enable: false,
      pageId: '',
      containerClass: '',
      ...initParams.facebook
    };

    if (facebook && facebook.enable) {
      try {
        new FacebookModule({
          pageId: facebook.pageId,
          containerClass: facebook.containerClass,
          applicationCode: initParams.applicationCode,
          userId: initParams.userId || ''
        });
      } catch (error) {
        Logger.error(error, 'facebook module initialization failed');
      }
    }
  }

  /**
   * Method for init InApp module
   * @param {IInitParams} params
   * @return {Promise<void>}
   */
  private async initInApp(params: IInitParams) {
    const isEnabledByConfig = await keyValue.get('isEnableWebInApps');
    const isEnabledByInitParams = params.inApps && params.inApps.enable;

    const inAppInitParams = {
      ...params.inApps,
      enable: isEnabledByConfig || isEnabledByInitParams
    };

    if (inAppInitParams.enable) {
      try {
        this.InApps = new InApps(inAppInitParams, this.api);

        await this.InApps.init()
          .then(() => {
            Logger.info('InApps module has been initialized');

            this.eventBus.emit(TEvents.INIT_IN_APPS_MODULE);
          })
          .catch((error) => {
            Logger.error(error, 'InApps module initialization has been failed');
          });
      } catch (error) {
        Logger.error(error, 'InApp module initialization has been failed')
      }
    }
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
   * Check device's session and call the appOpen method,
   * no more than once an hour.
   * Force need to Safari await subscribe status
   * @param {boolean} isForce
   * @returns {Promise<void>}
   */
  private async open(isForce?: boolean) {
    let lastApplicationOpenTime = await this.data.getLastOpenApplicationTime();
    const currentTime = Date.now();

    if (!lastApplicationOpenTime) {
      lastApplicationOpenTime = 0;
    }

    const isSendingPeriodExceeded = currentTime - lastApplicationOpenTime < CONSTANTS.PERIOD_SEND_APP_OPEN;
    const needSendOpenStatistics = isForce || !isSendingPeriodExceeded;

    if (!needSendOpenStatistics) {
      return;
    }

    await this.data.setLastOpenApplicationTime(currentTime);
    await this.api.applicationOpen();
  }

  private async onGetConfig(features: string[]) {
    const response = await this.api.getConfig(features);

    await this.data.setFeatures(response && response.features);

    return response && response.features;
  }

  private async initPushNotifications(params: IInitParams): Promise<void> {
    await this.data.setDefaultNotificationImage(params.defaultNotificationImage);
    await this.data.setDefaultNotificationTitle(params.defaultNotificationTitle);
    await this.data.setServiceWorkerUrl(params.serviceWorkerUrl);
    await this.data.setServiceWorkerScope(params.scope);

    await this.data.setInitParams({
      autoSubscribe: true,
      ...params,
    });

    await this.initDriver();

    const features = await this.onGetConfig(['page_visit', 'channels', 'vapid_key', 'web_in_apps', 'events']);

    if (features) {
      // page visited feature
      if (features.page_visit && features.page_visit.enabled) {
        await keyValue.set(CONSTANTS.PAGE_VISITED_URL, features.page_visit.entrypoint);
        this.sendStatisticsVisitedPage();
      }

      // send default event, page visited
      if (features.events && features.events.length) {
        const isPageVisitedEvent = features.events.some(
          ((event: string): boolean => event  === CONSTANTS.EVENT_PW_SITE_OPENED)
        );
        if (isPageVisitedEvent) {
          this.sendPostEventVisitedPage();
        }
      }

      // channels
      if (features.channels) {
        await keyValue.set(CONSTANTS.CHANNELS, features.channels);
      }

      // vapid key
      if (features.vapid_key) {
        await this.data.setApplicationServerKey(features.vapid_key)
      }

      // init web in apps
      if (features.web_in_apps) {
        await keyValue.set('isEnableWebInApps', features.web_in_apps.enabled);
      }
    }

    // Default actions on init
    try {
      await this.defaultProcess(params);
    } catch (error) {
      Logger.error(error, 'Internal error: defaultProcess fail');
    }
  }

  private async initDriver(): Promise<void> {
    if (this.platformChecker.isSafari) {
      const { safariWebsitePushID: webSitePushId } = await this.data.getInitParams();

      if (!webSitePushId) {
        throw new Error('For work with Safari Push Notification add safariWebsitePushID to initParams!');
      }

      this.driver = new PushServiceSafari(this.api, this.data, { webSitePushId });

      return;
    }

    if (this.platformChecker.isAvailableServiceWorker) {
      this.driver = new PushServiceDefault(this.api, this.data, {});

      return;
    }
  }

  public async sendPostEventVisitedPage() {
    const {
      document: { title },
      location: { href }
    } = window;

    this.api.postEvent(CONSTANTS.EVENT_PW_SITE_OPENED, {
      url: href,
      title: title,
      device_type: this.platformChecker.platform
    });
  }
}
