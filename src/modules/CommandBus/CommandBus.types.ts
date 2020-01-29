export enum TCommands {
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  GET_TAGS = 'GET_TAGS',
  SET_TAGS = 'SET_TAGS',
  GET_CHANNELS = 'GET_CHANNELS',
  CHECK_IS_SUBSCRIBED = 'CHECK_IS_SUBSCRIBED',
  CHECK_IS_MANUAL_UNSUBSCRIBED = 'CHECK_IS_MANUAL_UNSUBSCRIBED',

  CLOSE_IN_APP = 'CLOSE_IN_APP',
  SHOW_IN_APP = 'SHOW_IN_APP',
  OPEN_NEW_LINK = 'OPEN_NEW_LINK',

  POST_MESSAGE_TO_IFRAME = 'POST_MESSAGE_TO_IFRAME',
}

interface ICommandObserverSubscribe {
  command: TCommands.SUBSCRIBE;
  handler: (options: { commandId: string }) => void;
}

interface ICommandObserverUnsubscribe {
  command: TCommands.UNSUBSCRIBE;
  handler: (options: { commandId: string }) => void;
}

interface ICommandObserverGetTags {
  command: TCommands.GET_TAGS;
  handler: (options: { commandId: string }) => void;
}

interface ICommandObserverSetTags {
  command: TCommands.SET_TAGS;
  handler: (options: { commandId: string; tags: { [key: string]: any } }) => void;
}

interface ICommandObserverGetChannels {
  command: TCommands.GET_CHANNELS;
  handler: (options: { commandId: string }) => void;
}

interface ICommandObserverCheckIsSubscribe {
  command: TCommands.CHECK_IS_SUBSCRIBED;
  handler: (options: { commandId: string }) => void;
}

interface ICommandObserverCheckIsManualUnsubscribe {
  command: TCommands.CHECK_IS_MANUAL_UNSUBSCRIBED;
  handler: (options: { commandId: string }) => void;
}

interface ICommandObserverShowInApp {
  command: TCommands.SHOW_IN_APP;
  handler: (options: { commandId: string; code: string }) => void;
}

interface ICommandObserverCloseInApp {
  command: TCommands.CLOSE_IN_APP;
  handler: (options: { commandId: string }) => void;
}

interface ICommandObserverOpenNewLink {
  command: TCommands.OPEN_NEW_LINK;
  handler: (options: { commandId: string, href: string }) => void;
}

interface ICommandObserverPostMessageToIframe {
  command: TCommands.POST_MESSAGE_TO_IFRAME;
  handler: (options: { commandId: string, options?: any }) => void;
}

export type TCommandsObserver =
  | ICommandObserverSubscribe
  | ICommandObserverUnsubscribe
  | ICommandObserverGetTags
  | ICommandObserverSetTags
  | ICommandObserverGetChannels
  | ICommandObserverCheckIsSubscribe
  | ICommandObserverCheckIsManualUnsubscribe
  | ICommandObserverShowInApp
  | ICommandObserverCloseInApp
  | ICommandObserverOpenNewLink
  | ICommandObserverPostMessageToIframe

