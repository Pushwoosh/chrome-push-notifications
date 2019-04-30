import {sendFatalLogToRemoteServer} from './helpers/logger';
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


self.addEventListener('install', onInstallEventHandler);

self.addEventListener('activate', onActivateEventHandler);

self.addEventListener('push', onPushEventHandler);

self.addEventListener('notificationclick', onClickNotificationEventHandler);

self.addEventListener('notificationclose', onCloseNotificationEventHandler);


/**
 * On install SW event handler
 * Update indexedDB SW version and skip waiting stage
 * @param event
 */
function onInstallEventHandler(event: ExtendableEvent): void {

  async function onInstall(): Promise<void> {
    await Promise.all([
      keyValue.set(KEY_WORKER_VERSION, getVersion()),
      Logger.write('info', 'install')
    ]);

    await self.skipWaiting();
  }

  return event.waitUntil(
    onInstall()
      .catch(onInstallFailure)
  );
}

/**
 * On activate SW event handler
 * Do nothing, only write log
 * @param event
 */
function onActivateEventHandler(event: ExtendableEvent) {
  async function onActivate(): Promise<void> {
    await Promise.all([
      Logger.write('info', 'activate')
    ]);

    await self.clients.claim()
  }

  event.waitUntil(
    onActivate()
      .catch(onActivateFailure)
  )
}

/**
 * On push SW event handler
 * @param event
 */
function onPushEventHandler(event: PushEvent): void {
  async function onPush(event: PushEvent): Promise<void> {
    // wake up SW on all pages
    await self.clients.claim();

    // get payload
    const payload = await event.data.json();

    // create notification payload
    const notificationPayload = new NotificationPayload(payload);

    // get notification options
    const notificationOptions = await notificationPayload.getNotificationOptionsPayload();

    // get notification show options
    const notificationShowOptions = await notificationPayload.getShowNotificationOptions();

    // get message hash
    const messageHash = notificationPayload.messageHash;

    // logging in indexedDB;
    await Logger.write('info', JSON.stringify(notificationOptions), 'onPush');

    // show notification instance
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
      broadcastClients({type: EVENT_ON_PUSH_DELIVERY, payload: notificationOptions}),  // post message to window clients
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

    await Promise.all(onPushActions)
  }

  event.waitUntil(
    onPush(event)
      .catch((error) => onPushFailure(error, event))
  );
}

/**
 * On click notification event handler
 * @param event
 */
function onClickNotificationEventHandler(event: NotificationEvent): void {

  async function onClickNotification(event: NotificationEvent) {
    await self.clients.claim();

    // get notification options
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

  event.waitUntil(
    onClickNotification(event)
      .catch(onClickNotificationFailure)
  );
}

/**
 * On close notification event handler
 * @param event
 */
function onCloseNotificationEventHandler(event: NotificationEvent) {
  async function closeNotification(event: NotificationEvent): Promise<void> {
    await self.clients.claim();

    const notificationOptions = await parseNotificationEvent(event);
    const {code} = notificationOptions;

    event.notification.close();

    if (!code) {
      return;
    }

    const index = clickedNotifications.indexOf(code);
    if (index >= 0) {
      clickedNotifications.splice(index, 1);
    } else {
      return broadcastClients({type: EVENT_ON_NOTIFICATION_CLOSE, payload: notificationOptions})
    }
  }

  event.waitUntil(
    closeNotification(event)
      .catch(closeNotificationFailure)
  )
}

/**
 * Post message to all Window Clients
 * @param msg
 */
async function broadcastClients(msg: IPWBroadcastClientsParams) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage(msg));
}

async function openWindow(
  clientList: Array<TServiceWorkerClientExtended>,
  url: string,
  message: { type: string, payload: any }
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

async function onInstallFailure(error: Error | string): Promise<void> {
  const data = await keyValue.getAll();

  await sendFatalLogToRemoteServer({
    message: 'Error in onInstallEventHandler',
    code: 'FATAL-SW-001',
    error,
    applicationCode: data['params.applicationCode'],
    workerVersion: data['WORKER_VERSION']
  });
}

async function onActivateFailure(error: Error | string): Promise<void> {
  const data = await keyValue.getAll();

  await sendFatalLogToRemoteServer({
    message: 'Error in onActivateEventHandler',
    code: 'FATAL-SW-002',
    error,
    applicationCode: data['params.applicationCode'],
    workerVersion: data['WORKER_VERSION']
  })
}

async function onPushFailure(error: Error | string, event: PushEvent): Promise<void> {
  const data = await keyValue.getAll();

  await sendFatalLogToRemoteServer({
    message: 'Error in onPushEventHandler',
    code: 'FATAL-SW-003',
    error,
    applicationCode: data['params.applicationCode'],
    workerVersion: data['WORKER_VERSION']
  });

  if (!(error instanceof Error)) {
    error = new Error(error);
  }

  return messagesLog.add({
    error: `${error}`,
    stack: error.stack,
    payload: event.data && event.data.text()
  });
}

async function onClickNotificationFailure(error: Error | string): Promise<void> {
  const data = await keyValue.getAll();

  await sendFatalLogToRemoteServer({
    message: 'Error in onNotificationClickEventHandler',
    code: 'FATAL-SW-004',
    error,
    applicationCode: data['params.applicationCode'],
    workerVersion: data['WORKER_VERSION']
  })
}

async function closeNotificationFailure(error: Error | string): Promise<void> {
  const data = await keyValue.getAll();

  await sendFatalLogToRemoteServer({
    message: 'Error in onNotificationCloseEventHandler',
    code: 'FATAL-SW-005',
    error,
    applicationCode: data['params.applicationCode'],
    workerVersion: data['WORKER_VERSION']
  });
}
