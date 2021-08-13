import {
  generateHwid,
  generateUUID,
  getAuthToken,
  getFcmKey,
  getPublicKey,
  getPushToken,
} from '../functions'
import platformChecker from '../modules/PlatformChecker';

export function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}


import {
  DEFAULT_SERVICE_WORKER_URL,
  EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG,
  EVENT_ON_PERMISSION_DENIED,
  EVENT_ON_PERMISSION_GRANTED,
  EVENT_ON_SHOW_NOTIFICATION_PERMISSION_DIALOG,
  EVENT_ON_SW_INIT_ERROR,
  KEY_API_PARAMS,
  KEY_DEVICE_DATA_REMOVED,
  KEY_FCM_SUBSCRIPTION,
  KEY_SENDER_ID,
  MANUAL_UNSUBSCRIBE,
  PERMISSION_DENIED,
  PERMISSION_GRANTED,
  PERMISSION_PROMPT
} from '../constants';
import {keyValue} from '../storage';
import {Logger} from '../logger';
import Params from '../modules/data/Params';
import {EventBus, TEvents} from '../modules/EventBus/EventBus';


declare const Notification: {
  permission: typeof PERMISSION_DENIED | typeof PERMISSION_GRANTED | typeof PERMISSION_PROMPT
};

type WindowExtended = Window & {Notification: any}


class WorkerDriver implements IPWDriver {
  private readonly paramsModule: Params;
  private readonly eventBus: EventBus;

  constructor(
    private params: TWorkerDriverParams,
    paramsModule: Params = new Params(),
    eventBus?: EventBus,
  ) {
    this.paramsModule = paramsModule;
    this.eventBus = eventBus || EventBus.getInstance();
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
    this.eventBus.emit(TEvents.SHOW_NOTIFICATION_PERMISSION_DIALOG);

    const permission = await (window as WindowExtended).Notification.requestPermission();

    // emit event when permission dialog hide with permission state
    this.params.eventEmitter.emit(EVENT_ON_HIDE_NOTIFICATION_PERMISSION_DIALOG, permission);
    this.eventBus.emit(TEvents.HIDE_NOTIFICATION_PERMISSION_DIALOG);

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

    const options: any = { userVisibleOnly: true };

    const VAPIDKey = await keyValue.get('VAPIDKey');
    const needAddVAPIDKeyToSubscribeOptions = platformChecker.platform  === 11 && VAPIDKey;

    if (needAddVAPIDKeyToSubscribeOptions) {
      options.applicationServerKey = urlB64ToUint8Array(VAPIDKey);
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

    let p256dh = getPublicKey(subscription);
    let auth = getAuthToken(subscription);

    const VAPIDKey = await keyValue.get('VAPIDKey');

    if (VAPIDKey) {
      const _p256dn = (subscription as any).getKey('p256dh');
      const _auth = (subscription as any).getKey('auth');

      p256dh = btoa(String.fromCharCode.apply(String, new Uint8Array(_p256dn)));
      auth = btoa(String.fromCharCode.apply(String, new Uint8Array(_auth)));
    }

    const body = {
      endpoint: subscription ? subscription.endpoint : '',
      encryption_key: p256dh, //p256
      encryption_auth: auth, //auth
      authorized_entity: senderID,
      application_pub_key: VAPIDKey ? VAPIDKey : undefined
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
