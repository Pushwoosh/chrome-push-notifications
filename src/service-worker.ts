import {
  keyValue,
  message as messagesLog,
} from './storage';
import {
  KEY_WORKER_VERSION,
  KEY_LAST_OPEN_MESSAGE,
  PERIOD_GOAL_EVENT,

  KEY_DELAYED_EVENT,
  EVENT_ON_PUSH_DELIVERY,
  EVENT_ON_NOTIFICATION_CLICK,
  EVENT_ON_NOTIFICATION_CLOSE,
  EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE
} from './constants';
import {getVersion, parseSerializedNotificationParams} from './functions';
import Logger from './logger';
import WorkerPushwooshGlobal from './worker/global';
import PushwooshNotification from './worker/notification';
import NotificationPayload from './models/NotificationPayload';
import InboxMessages from './models/InboxMessages';
import InboxMessagesPublic from './modules/InboxMessagesPublic';


const Pushwoosh = self.Pushwoosh = new WorkerPushwooshGlobal();
const clickedNotifications: string[] = [];

/**
 * post message to all Window Clients
 * @param msg
 */
async function broadcastClients(msg: IPWBroadcastClientsParams) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(msg);
  });
}

/**
 * Receive push handler
 * @param event
 */
async function onPush(event: PushEvent) {
  try {
    // Build payloads from receiving
    const payload = await event.data.json();
    const notificationPayload = new NotificationPayload(payload);
    const notificationOptions = await notificationPayload.getNotificationOptionsPayload();
    const notificationShowOptions = await notificationPayload.getShowNotificationOptions();
    const messageHash = notificationPayload.messageHash;

    await Logger.write('info', JSON.stringify(notificationOptions), 'onPush');

    // Show notification instance
    const notification = new PushwooshNotification(
      notificationShowOptions,
      notificationPayload.duration,
      notificationPayload.body,
      await notificationPayload.getTitle()
    );

    // Call receive push listeners
    const callbacks = Pushwoosh.getListeners('onPush');
    await callbacks.reduce((pr, fun) => pr.then(() => fun(notification)), Promise.resolve());

    // Execute receive push actions
    const onPushActions = [
      notification.show(),  // Show notification
      messagesLog.add({  // Put message to messages store
        payload: payload,
        parsedPayload: notificationOptions,
        showOptions: notificationShowOptions
      }),
      broadcastClients({type: EVENT_ON_PUSH_DELIVERY, payload: notificationOptions})  // post message to window clients
    ];

    // Send delivery statistic
    if (messageHash) {
      onPushActions.push(
        Pushwoosh.initApi().then(() => Pushwoosh.api.messageDeliveryEvent(messageHash))
      );
    }

    // Inbox message actions
    if (notificationPayload.inboxId !== '') {
      const inboxMessages = new InboxMessages();
      const inboxMessagesPublic = new InboxMessagesPublic();
      const inboxMessagePayload = await notificationPayload.getInboxMessage();

      const payload = await inboxMessagesPublic.publicMessageBuilder(inboxMessagePayload);
      onPushActions.push(
        inboxMessages.putMessage(inboxMessagePayload),  // put message to inboxMessages store
        broadcastClients({  // post message to window clients
          type: EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE,
          payload
        })
      );
    }

    return Promise.all(onPushActions);
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
  const notificationTag = parseSerializedNotificationParams(notification.tag, {});

  let url = '';

  if (event.action && Array.isArray(notificationData.buttons)) {
    const button = notificationData.buttons.find((button: INotificationButton) => button.action === event.action) || {};
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
    inboxId: notificationData.inboxId,

    messageHash: notificationTag.messageHash,
    customData: notificationTag.customData,
    openUrl: notificationTag.url,

    tag: notification.tag,
    url
  };
}

async function onClick(event: NotificationEvent) {
  const notificationOptions = await parseNotificationEvent(event);
  const {
    messageHash,
    url,
    code,
    inboxId
  } = notificationOptions;

  if (code) {
    clickedNotifications.push(code);
  }

  if (inboxId !== '') {
    const inboxMessages = new InboxMessages();

    const message = await inboxMessages.getMessage(inboxId);
    (<TInboxMessageStatusOpen>message.status) = 3;
    await inboxMessages.putMessage(message);
  }

  event.notification.close();

  const message = {type: EVENT_ON_NOTIFICATION_CLICK, payload: notificationOptions};

  if (url) {
    await event.waitUntil(self.clients.matchAll({type: 'window'})
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
