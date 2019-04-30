export = PW;
export as namespace PW;

declare namespace PW {
  class Pushwoosh {
    constructor();

    /**
     * Method that puts the stored error/info messages to browser console.
     * @type {{showLog: (() => Promise<any>); showKeyValues: (() => Promise<any>); showMessages: (() => Promise<any>)}}
     */
    debug: any;

    /**
     * Polymorph PW method.
     * Can get an array in the format of [string, params | callback] or a function.
     *
     *  // with callback:
     *  Pushwoosh.push(['onNotificationClick', function(api, payload) {
     *    // click on the notification
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
     */
    push(input: EventHandler | [EventName, EventHandler] | ['init', InitParams]): void;

    /**
     * Checks device's subscription status
     * @returns {boolean | Promise<boolean>}
     */
    isSubscribed(): boolean | Promise<boolean>;

    /**
     * Method returns hardware id.
     * @returns {Promise<string>}
     */
    getHWID(): Promise<string>;

    /**
     * Method returns push token.
     * @returns {Promise<string>}
     */
    getPushToken(): Promise<string>;

    /**
     * Method returns userId
     * @returns {Promise<string | null>}
     */
    getUserId(): Promise<string>;

    /**
     * Method returns an object with all params.
     * @returns {Promise<PWParams>}
     */
    getParams(): Promise<PWParams>;

    /**
     * Method initializes the permission dialog on the device
     * and registers through the API in case the device hasn't been registered before.
     * @param {{registerLess?: boolean}} params
     * @returns {Promise<void>}
     */
    subscribe(): Promise<void>;

    /**
     * Unsubscribes the device.
     * @returns {Promise<void>}
     */
    unsubscribe(): Promise<void>;
  }

  type EventHandler = (api: API, params?: any) => void;

  type EventName = 'onReady'
    | 'onSubscribe'
    | 'onUnsubscribe'
    | 'onRegister'
    | 'onPermissionPrompt'
    | 'onPermissionDenied'
    | 'onPermissionGranted'
    | 'onNotificationClick'
    | 'onPushDelivery'
    | 'onNotificationClose'
    | 'onSWInitError'
    | 'onChangeCommunicationEnabled';

  interface API {
    /**
     * Calls API method applicationOpen with device parameters.
     * @returns {Promise<void>}
     */
    applicationOpen(): Promise<void>;

    /**
     * Calls Pushwoosh API method.
     * @param {string} methodName
     * @param params
     * @returns {Promise<any>}
     */
    callAPI(methodName: string, params?: any): Promise<any>;

    /**
     * Calls API method getTags.
     * Retrieves a list of Tags with corresponding values for the device.
     * @returns {{[p: string]: any}}
     */
    getTags(): { [key: string]: any };

    /**
     * Calls API method messageDeliveryEvent.
     * Registers push delivery event for the device.
     * @param {string} hash
     * @returns {Promise<void>}
     */
    messageDeliveryEvent(hash: string): Promise<void>;

    /**
     * Calls API method postEvent.
     * Calls the event within the particular application.
     * Event name is humanized, and should match the event name in Pushwoosh Control Panel.
     * @param {string} eventName
     * @param {{[p: string]: any}} params
     * @returns {Promise<void>}
     */
    postEvent(eventName: string, params: { [key: string]: any }): Promise<void>;

    /**
     * Calls API method pushStat.
     * Registers a push open event
     * @param {string} hash
     * @returns {Promise<void>}
     */
    pushStat(hash: string): Promise<void>;

    /**
     * Calls API method registerDevice with device parameters.
     * Saves the registration status to localStorage.
     * @returns {Promise<void>}
     */
    registerDevice(): Promise<void>;

    /**
     * Calls API method registerUser with user parameters.
     * Sets new user data to IndexedDB if needed.
     * @param {string} userId
     * @returns {Promise<void>}
     */
    registerUser(userId: string): Promise<void>;

    /**
     * Calls API method setTags.
     * Sets Tag values for the device.
     * @param {{[p: string]: any}} tags
     * @returns {Promise<void>}
     */
    setTags(tags: { [key: string]: any }): Promise<void>;

    /**
     * Calls API method unregisterDevice.
     * Removes the registration status from localStorage.
     * @returns {Promise<void>}
     */
    unregisterDevice(): Promise<void>;

    /**
     * Send "GDPRConsent" postEvent and depends on param "isEnabled"
     * device will be registered/unregistered from all communication channels.
     * @param {boolean} isEnabled
     * @returns {Promise<void>}
     */
    setCommunicationEnabled(isEnabled: boolean): Promise<void>;

    /**
     * Check current communication enabled
     * @returns {Promise<boolean>}
     */
    isCommunicationEnabled(): Promise<boolean>;

    /**
     * Send "GDPRDelete" postEvent and remove all device device data from Pushwoosh.
     * @returns {Promise<void>}
     */
    removeAllDeviceData(): Promise<void>;
  }

  /**
   * Initialization parameters.
   */
  interface InitParams {
    applicationCode: string;
    autoSubscribe?: boolean;
    defaultNotificationImage?: string;
    defaultNotificationTitle?: string;
    driversSettings?: {
      worker?: {
        serviceWorkerUrl?: string;
        applicationServerPublicKey?: string;
      }
    };
    logLevel?: 'error' | 'info' | 'debug';
    pushwooshApiUrl?: string;
    pushwooshUrl?: string;
    safariWebsitePushID?: string;
    scope?: string;
    serviceWorkerUrl?: string | null;
    subscribeWidget?: SubscribeWidget;
    inboxWidget?: InboxWidget;
    tags?: { [key: string]: any };
    userId?: string;
  }

  /**
   * Init params and driver api params
   */
  interface PWParams {
    applicationCode: string;
    autoSubscribe?: boolean;
    defaultNotificationImage?: string;
    defaultNotificationTitle?: string;
    logLevel?: 'error' | 'info' | 'debug';
    pushwooshApiUrl?: string;
    safariWebsitePushID?: string;
    scope?: string;
    subscribeWidget?: SubscribeWidget;
    inboxWidget?: InboxWidget;
    tags?: {
      Language: string;
      'Device Model': string;
      [key: string]: any;
    };
    userId?: string;
    pushwooshUrl?: string;
    deviceType?: number;
    serviceWorkerUrl?: string | null;
    authToken?: string;
    fcmPushSet?: string;
    fcmToken?: string;
    hwid?: string;
    publicKey?: string;
    pushToken?: string;
    driversSettings?: {
      worker: {
        serviceWorkerUrl: string;
        applicationServerPublicKey?: string;
      }
    };
  }

  /**
   * Sets subscription widget interface parameters.
   */
  interface SubscribeWidget {
    enable: boolean;
    position?: string,
    bgColor?: string,
    bellColor?: string,
    shadow?: string,
    size?: string,
    indent?: string,
    zIndex?: string,
    tooltipText?: TooltipText
  }

  /**
   * Sets inbox widget interface parameters.
   */
  interface InboxWidget {
    enable: boolean;
    triggerId?: string;
    position?: string;
  }

  /**
   * Sets subscribe widget tooltip interface parameters.
   */
  interface TooltipText {
    successSubscribe?: string;
    needSubscribe?: string;
    blockSubscribe?: string;
    alreadySubscribed?: string;
  }

  /**
   * Payload for onPushDelivery event callback.
   *
   * Pushwoosh.push['onPushDelivery', (api: PW.API, payload: PW.onPushDeliveryPayload) => {}]
   */
  interface onPushDeliveryPayload {
    title: string;
    body: string;
    icon: string;
    openUrl: string;
    messageHash: string;
    customData?: { [key: string]: any };
  }

  /**
   * Payload for onNotificationClick event callback.
   *
   * Pushwoosh.push['onNotificationClick', (api: PW.API, payload: PW.onNotificationClickPayload) => {}]
   */
  interface onNotificationClickPayload {
    url: string;
    messageHash: string;
    customData?: { [key: string]: any };
  }

  /**
   * Payload for onNotificationClose event callback.
   *
   * Pushwoosh.push['onNotificationClose', (api: PW.API, payload: PW.onNotificationClosePayload) => {}]
   */
  interface onNotificationClosePayload {
    url: string;
    messageHash: string;
  }
}
