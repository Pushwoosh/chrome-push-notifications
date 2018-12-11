import {keyValue, message as messagesLog} from './storage';
import {
  KEY_WORKER_VERSION,
  KEY_LAST_OPEN_MESSAGE,
  PERIOD_GOAL_EVENT,
  DEFAULT_NOTIFICATION_TITLE,
  DEFAULT_NOTIFICATION_IMAGE,
  DEFAULT_NOTIFICATION_URL,
  KEY_INIT_PARAMS,

  KEY_DELAYED_EVENT,
  EVENT_ON_PUSH_DELIVERY,
  EVENT_ON_NOTIFICATION_CLICK,
  EVENT_ON_NOTIFICATION_CLOSE
} from './constants';
import {getVersion, prepareDuration} from './functions';
import Logger from './logger';
import WorkerPushwooshGlobal from './worker/global';
import PushwooshNotification from './worker/notification';

const Pushwoosh = self.Pushwoosh = new WorkerPushwooshGlobal();
const clickedNotifications: string[] = [];

async function broadcastClients(msg: IPWBroadcastClientsParams) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(msg);
  });
}

async function JSONParse(json: any, defaultValue?: any) {
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    }
    catch (e) {
      await Logger.write('error', e, 'Error occurred during json parsing');
    }
  }
  return json === undefined && defaultValue !== undefined ? defaultValue : json;
}

async function parsePushEvent(event: PushEvent, initParams: IPWParams): Promise<INotificationOptions> {
  const payload = await event.data.json();
  const notificationData = payload.data || payload;

  //XMPP Chrome Sender payload contains buttons as string
  const buttons = await JSONParse(notificationData.buttons, []);
  const customData = await JSONParse(notificationData.u, {});

  return {
    ...notificationData,
    title: notificationData.header || initParams.defaultNotificationTitle || DEFAULT_NOTIFICATION_TITLE,
    body: notificationData.body,
    buttons,
    customData,
    icon: notificationData.i || initParams.defaultNotificationImage || DEFAULT_NOTIFICATION_IMAGE,
    image: notificationData.image || '',
    messageHash: notificationData.p || '',
    campaignCode: notificationData.pwcid || '',
    duration: prepareDuration(notificationData.duration),
    openUrl: notificationData.l || DEFAULT_NOTIFICATION_URL,
    badge: notificationData.badge
  };
}

async function onPush(event: PushEvent) {
  try {
    const initParams = await keyValue.get(KEY_INIT_PARAMS);
    const notificationOptions = await parsePushEvent(event, initParams);

    Logger.setLevel(initParams.logLevel);
    await Logger.write('info', JSON.stringify(notificationOptions), 'onPush');

    const {messageHash} = notificationOptions;
    const notification = new PushwooshNotification(notificationOptions);
    const callbacks = Pushwoosh.getListeners('onPush');

    await callbacks.reduce((pr, fun) => pr.then(() => fun(notification)), Promise.resolve());

    return Promise.all([
      notification.show(),
      messageHash && Pushwoosh.initApi().then(() => Pushwoosh.api.messageDeliveryEvent(messageHash)),
      messagesLog.add({
        ...notification._forLog(),
        payload: notificationOptions
      }),
      broadcastClients({type: EVENT_ON_PUSH_DELIVERY, payload: notificationOptions})
    ]);
  }
  catch (e) {
    return messagesLog.add({
      error: `${e}`,
      stack: e.stack,
      payload: event.data.text()
    });
  }
}

async function parseNotificationEvent(event: NotificationEvent): Promise<INotificationOptions> {
  const {notification = {}} = event;
  const {data: notificationData} = notification;
  const notificationTag = await JSONParse(notification.tag, {});

  let url = '';

  if (event.action && Array.isArray(notificationData.buttons)) {
    const button = notificationData.buttons.find((button: TNotificationButton) => button.action === event.action) || {};
    url = button.url;
  } else {
    url = notificationTag.url;
  }

  return {
    requireInteraction: notification.requireInteraction,
    title: notification.title,
    body: notification.body,
    icon: notification.icon,

    buttons: notificationData.buttons,
    duration: notificationData.duration,
    image: notificationData.image,
    code: notificationData.code,
    campaignCode: notificationData.campaignCode,

    messageHash: notificationTag.messageHash,
    customData: notificationTag.customData,
    openUrl: notificationTag.url,

    tag: notification.tag,
    url
  };
}

async function onClick(event: NotificationEvent) {
  const notificationOptions = await parseNotificationEvent(event);
  const {messageHash, url, code} = notificationOptions;

  if (code) {
    clickedNotifications.push(code);
  }

  event.notification.close();

  const message = {type: EVENT_ON_NOTIFICATION_CLICK, payload: notificationOptions};

  if (url) {
    await event.waitUntil(self.clients.matchAll({type: "window"})
      .then((clientList: Array<TServiceWorkerClientExtended>) => openWindow(clientList, url, message)));
  }

  return Promise.all([
    Pushwoosh.initApi().then(() => Pushwoosh.api.pushStat(messageHash)),
    keyValue.set(KEY_LAST_OPEN_MESSAGE, {
      url,
      messageHash,
      expiry: Date.now() + PERIOD_GOAL_EVENT
    }),
    broadcastClients(message)
  ]);
}

async function openWindow(
  clientList: Array<TServiceWorkerClientExtended>,
  url: string,
  message: {type: string, payload: any}
) {
  for (let index = clientList.length - 1; index > -1; --index) {
    const client = clientList[index];
    if ((url === client.url || url === '/') && 'focus' in client) {
      client.focus();
      return;
    }
  }
  if (self.clients.openWindow) {
    await keyValue.set(KEY_DELAYED_EVENT, message);
    return self.clients.openWindow(url);
  }
}

async function onClose(event: NotificationEvent) {
  const notificationOptions = await parseNotificationEvent(event);
  const {code} = notificationOptions;

  event.notification.close();

  if (!code) {
    return;
  }

  const index = clickedNotifications.indexOf(code);
  if (index >= 0) {
    clickedNotifications.splice(index, 1);
  }
  else {
    return broadcastClients({type: EVENT_ON_NOTIFICATION_CLOSE, payload: notificationOptions})
  }
}

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(Promise.all([
    keyValue.set(KEY_WORKER_VERSION, getVersion()),
    Logger.write('info', 'install')
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', function (event: ExtendableEvent) {
  event.waitUntil(Promise.all([
    Logger.write('info', 'activate')
  ]).then(() => self.clients.claim()));
});

self.addEventListener('push', (event: PushEvent) => {
  event.waitUntil(
    Promise.resolve(self.clients.claim())
      .then(() => onPush(event).catch(e => console.log(e))),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.waitUntil(
    Promise.resolve(self.clients.claim())
      .then(() => onClick(event).catch(e => console.log(e)))
  );
});

self.addEventListener('notificationclose', (event: NotificationEvent) => {
  event.waitUntil(onClose(event).catch(e => console.log(e)));
});
