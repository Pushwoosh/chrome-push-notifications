import {
  getPushToken,
  getFcmKey,
  generateHwid,
  getPublicKey,
  getAuthToken,
  urlB64ToUint8Array,
  generateUUID
} from '../functions'
import platformChecker from '../modules/PlatformChecker';

import {
  PERMISSION_PROMPT,
  PERMISSION_DENIED,
  PERMISSION_GRANTED,
  KEY_SENDER_ID,
  KEY_API_PARAMS,
  KEY_FCM_SUBSCRIPTION,
  KEY_DEVICE_DATA_REMOVED,
  EVENT_ON_SW_INIT_ERROR,
  EVENT_ON_PERMISSION_DENIED,
  EVENT_ON_PERMISSION_GRANTED,
  DEFAULT_SERVICE_WORKER_URL,
  MANUAL_UNSUBSCRIBE,
  EVENT_ON_SHOW_NOTIFICATION_PERMISSION_DIALOG,
  EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG
} from '../constants';
import {keyValue} from '../storage';
import Logger from '../logger';
import Params from '../modules/data/Params';


declare const Notification: {
  permission: typeof PERMISSION_DENIED | typeof PERMISSION_GRANTED | typeof PERMISSION_PROMPT
};

type WindowExtended = Window & {Notification: any}


class WorkerDriver implements IPWDriver {
  private readonly paramsModule: Params;

  constructor(
    private params: TWorkerDriverParams,
    paramsModule: Params = new Params()
  ) {
    this.paramsModule = paramsModule;
  }

  async initWorker() {
    const {serviceWorkerUrl, scope} = this.params;

    const options = scope ? {scope} : undefined;
    const url = serviceWorkerUrl === null
      ? `/${DEFAULT_SERVICE_WORKER_URL}?cache_clean=${generateUUID()}`
      : `${serviceWorkerUrl}?cache_clean=${generateUUID()}`;

    await navigator.serviceWorker.register(url, options);
  }

  async getPermission() {
    return Notification.permission;
  }

  async isSubscribed() {
    let serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      return false;
    }
    await serviceWorkerRegistration.update();
    let subscription = await serviceWorkerRegistration.pushManager.getSubscription();
    return !!subscription;
  }

  emit(event: string) {
    const {eventEmitter = {emit: (e: any) => e}} = this.params || {};
    eventEmitter.emit(event);
  }

  async askSubscribe(isDeviceRegistered?: boolean) {
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    const subscription = await serviceWorkerRegistration.pushManager.getSubscription();

    if (subscription && subscription.unsubscribe && isDeviceRegistered) {
      await subscription.unsubscribe();
    }

    const dataIsRemoved = await keyValue.get(KEY_DEVICE_DATA_REMOVED);
    if (dataIsRemoved) {
      Logger.write('error', 'Device data has been removed');
      return;
    }

    // emit event when permission dialog show
    this.params.eventEmitter.emit(EVENT_ON_SHOW_NOTIFICATION_PERMISSION_DIALOG);
    const permission = await (window as WindowExtended).Notification.requestPermission();

    // emit event when permission dialog hide with permission state
    this.params.eventEmitter.emit(EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG, permission);

    if (permission === PERMISSION_GRANTED) {
      return await this.subscribe(serviceWorkerRegistration);
    } else if (permission === PERMISSION_DENIED) {
      this.emit(EVENT_ON_PERMISSION_DENIED);
    }
    return subscription;
  }

  private async subscribe(registration: ServiceWorkerRegistration) {
    const dataIsRemoved = await keyValue.get(KEY_DEVICE_DATA_REMOVED);
    if (dataIsRemoved) {
      Logger.write('error', 'Device data has been removed');
      return;
    }

    const options: any = {userVisibleOnly: true};
    if (<TPlatformChrome>platformChecker.platform == 11 && this.params.applicationServerPublicKey) {
      options.applicationServerKey = urlB64ToUint8Array(this.params.applicationServerPublicKey);
    }
    const subscription = await registration.pushManager.subscribe(options);
    await keyValue.set(MANUAL_UNSUBSCRIBE, 0);
    this.emit(EVENT_ON_PERMISSION_GRANTED);
    await this.getFCMToken();
    return subscription;
  }

  /**
   * Unsubscribe device
   * @returns {Promise<boolean>}
   */
  async unsubscribe(): Promise<boolean> {
    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      return false;
    }
    const subscription = await serviceWorkerRegistration.pushManager.getSubscription();
    if (subscription && subscription.unsubscribe) {
      await keyValue.set(MANUAL_UNSUBSCRIBE, 1);
      return subscription.unsubscribe();
    } else {
      return false;
    }
  }

  async getAPIParams() {
    let serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();
    if (!serviceWorkerRegistration) {
      const {
        [KEY_API_PARAMS]: savedApiParams
      } = await keyValue.getAll();
      if (savedApiParams) {
        return savedApiParams;
      }
      else {
        this.emit(EVENT_ON_SW_INIT_ERROR);
        throw new Error('No service worker registration');
      }
    }
    serviceWorkerRegistration = await navigator.serviceWorker.ready;

    const subscription = await serviceWorkerRegistration.pushManager.getSubscription();

    const pushToken = getPushToken(subscription);

    const apiParams = {
      pushToken,
      hwid: await generateHwid(this.params.applicationCode, pushToken),
      publicKey: getPublicKey(subscription),
      authToken: getAuthToken(subscription),
      fcmPushSet: await getFcmKey(subscription, 'pushSet'),
      fcmToken: await getFcmKey(subscription, 'token')
    };

    await this.paramsModule.setHwid(apiParams.hwid);

    return apiParams;
  }

  /**
   * Check for native subscription, and is it, subscribe to FCM.
   * @returns {Promise<void>}
   */
  async getFCMToken() {
    const serviceWorkerRegistration = await navigator.serviceWorker.getRegistration();

    let subscription = null;
    if (serviceWorkerRegistration) {
      subscription = await serviceWorkerRegistration.pushManager.getSubscription();
    }
    const senderID = await keyValue.get(KEY_SENDER_ID);
    const fcmURL = 'https://fcm.googleapis.com/fcm/connect/subscribe';

    if (!senderID) {
      console.warn('SenderID can not be found');
      return;
    }

    const body = {
      endpoint: subscription ? subscription.endpoint : '',
      encryption_key: getPublicKey(subscription), //p256
      encryption_auth: getAuthToken(subscription), //auth
      authorized_entity: senderID,
    };
    await fetch(fcmURL, {
      method: 'post',
      headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body: JSON.stringify(body)
    }).then((response: Response) => this.onFCMSubscribe(response));
  }

  /**
   * Set FCM pushset and tokens in indexDB.
   * @returns {Promise<void>}
   */
  async onFCMSubscribe(response: Response) {
    if (response.status === 200) {
      try {
        const subscription = await response.json();
        await keyValue.set(KEY_FCM_SUBSCRIPTION, {
          token: subscription.token || '',
          pushSet: subscription.pushSet || ''
        });
      }
      catch (error) {
        console.warn('Can\'t parse FCM response', error);
      }
    }
    else {
      console.warn('Error while FCM Subscribe', response.text());
      return;
    }
  }

  /**
   * Check is need to re-register device
   * @returns {Promise<boolean>}
   */
  async isNeedUnsubscribe() {
    const isValidSenderID = await this.checkSenderId();
    const isFCMSubscribed = await this.checkFCMKeys();

    return !isValidSenderID || !isFCMSubscribed;
  }

  /**
   * Check for FCM keys in indexDB
   * @returns {Promise<boolean>}
   */
  async checkFCMKeys() {
    const {pushSet = '', token = ''} = await keyValue.get(KEY_FCM_SUBSCRIPTION) || {};
    return !!(pushSet && token);
  }

  /**
   * Check sender id in manifest
   * @returns {Promise<boolean>}
   */
  async checkSenderId() {
    const manifest = document.querySelector('link[rel="manifest"]');

    if (manifest === null) {
      Logger.write('error', 'Link to manifest can not find');
      return false;
    }
    const manifestUrl = manifest.getAttribute('href') || '';

    return await fetch(manifestUrl, {
      method: 'get',
      headers: {'Content-Type': 'application/json;charset=UTF-8'}
    }).then((response: Response) => this.isSameManifest(response));
  }

  /**
   * On load manifest callback
   * @param response: any
   * @returns {Promise<boolean>}
   */
  async isSameManifest(response: Response) {
    if (response.status === 200) {
      const manifest = await response.text();

      const regexpSenderId = /("|')?gcm_sender_id("|')?:\s*("|')?(\d+)("|')?/;
      const match = manifest.match(regexpSenderId);
      let manifestSenderID = '';

      if (match) {
        manifestSenderID = match[4];
      }

      const senderId = await keyValue.get(KEY_SENDER_ID);

      if (manifestSenderID && senderId !== manifestSenderID) {
        await keyValue.set(KEY_SENDER_ID, manifestSenderID);
        return false;
      }

      return true;
    }
    else {
      throw new Error('Cant load manifest.json')
    }
  }
}

export default WorkerDriver;
