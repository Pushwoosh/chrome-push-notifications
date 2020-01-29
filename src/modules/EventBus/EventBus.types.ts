export enum TEvents {
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  GET_TAGS = 'GET_TAGS',
  SET_TAGS = 'SET_TAGS',
  GET_CHANNELS = 'GET_CHANNELS',
  CHECK_IS_SUBSCRIBED = 'CHECK_IS_SUBSCRIBED',
  CHECK_IS_MANUAL_UNSUBSCRIBED = 'CHECK_IS_MANUAL_UNSUBSCRIBED',
  SHOW_NOTIFICATION_PERMISSION_DIALOG = 'SHOW_NOTIFICATION_PERMISSION_DIALOG',
  HIDE_NOTIFICATION_PERMISSION_DIALOG = 'HIDE_NOTIFICATION_PERMISSION_DIALOG',

  INIT_IN_APPS_MODULE = 'INIT_IN_APPS_MODULE'
}

interface IEventObserverSubscribe {
  event: TEvents.SUBSCRIBE;
  handler: (options: { eventId: string }) => void;
}

interface IEventObserverUnsubscribe {
  event: TEvents.UNSUBSCRIBE;
  handler: (options: { eventId: string }) => void;
}

interface IEventObserverGetTags {
  event: TEvents.GET_TAGS;
  handler: (options: { eventId: string; tags: { [key: string]: any } }) => void;
}

interface IEventObserverSetTags {
  event: TEvents.SET_TAGS;
  handler: (options: { eventId: string }) => void;
}

interface IEventObserverGetChannels {
  event: TEvents.GET_CHANNELS;
  handler: (options: { eventId: string; channels: string[] }) => void;
}

interface IEventObserverCheckIsSubscribe {
  event: TEvents.CHECK_IS_SUBSCRIBED;
  handler: (options: { eventId: string, state: boolean }) => void;
}

interface IEventObserverCheckIsManualUnsubscribe {
  event: TEvents.CHECK_IS_MANUAL_UNSUBSCRIBED;
  handler: (options: { eventId: string, state: boolean }) => void;
}

interface IEventObserverShowNotificationPermissionDialog {
  event: TEvents.SHOW_NOTIFICATION_PERMISSION_DIALOG;
  handler: (options: { eventId: string }) => void;
}

interface IEventObserverHideNotificationPermissionDialog {
  event: TEvents.HIDE_NOTIFICATION_PERMISSION_DIALOG;
  handler: (options: { eventId: string }) => void;
}

interface IEventObserverInitInAppsModule {
  event: TEvents.INIT_IN_APPS_MODULE;
  handler: (options: { eventId: string }) => void;
}

export type TEventObserver =
  | IEventObserverSubscribe
  | IEventObserverUnsubscribe
  | IEventObserverGetTags
  | IEventObserverSetTags
  | IEventObserverGetChannels
  | IEventObserverCheckIsSubscribe
  | IEventObserverCheckIsManualUnsubscribe
  | IEventObserverShowNotificationPermissionDialog
  | IEventObserverHideNotificationPermissionDialog
  | IEventObserverInitInAppsModule
