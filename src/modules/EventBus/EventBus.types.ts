// events names specification
type TEventNameNeedShowInApp = 'needShowInApp';
type TEventNameNeedCloseInApp = 'needCloseInApp';
type TEventNameOpenNewLink = 'openNewLink';
type TEventNameAskSubscribe = 'askSubscribe';

// events option specification
interface TEventOptionsNeedShowInApp {
  code: string;
}

// events option specification
interface TEventOptionsOpenNewLink {
  href: string;
}

type TEventOptionsNeedCloseInApp = null;
type TEventOptionsAskSubscribe = null;

// events callbacks specification
type TEventCallbackNeedShowInApp = (options: TEventOptionsNeedShowInApp) => any;
type TEventCallbackNeedCloseInApp = (options: TEventOptionsNeedCloseInApp) => any;
type TEventCallbackAskSubscribe = (options: TEventOptionsAskSubscribe) => any;
type TEventCallbackOpenNewLink = (options: TEventOptionsOpenNewLink) => any;

// events union names
export type TEventsNames =
  | TEventNameNeedShowInApp
  | TEventNameNeedCloseInApp
  | TEventNameOpenNewLink
  | TEventNameAskSubscribe;

// events union options
export interface TEventsOptions {
  'needShowInApp': TEventOptionsNeedShowInApp;
  'needCloseInApp': TEventOptionsNeedCloseInApp;
  'openNewLink': TEventOptionsOpenNewLink;
  'askSubscribe': TEventOptionsAskSubscribe;
}

// events union callbacks
export interface TEventsCallbacks {
  'needShowInApp': TEventCallbackNeedShowInApp;
  'needCloseInApp': TEventCallbackNeedCloseInApp;
  'openNewLink': TEventCallbackOpenNewLink;
  'askSubscribe': TEventCallbackAskSubscribe;
}

// observer
export type TEventObserver<T extends TEventsNames> = {
  event: T;
  callback: TEventsCallbacks[T];
}
