type TMethodCheckDevice = 'checkDevice';
type TMethodGetConfig = 'getConfig';
type TMethodApplicationOpen = 'applicationOpen';
type TMethodRegisterDevice = 'registerDevice';
type TMethodUnregisterDevice = 'unregisterDevice';
type TMethodDeleteDevice = 'deleteDevice';
type TMethodMessageDeliveryEvent = 'messageDeliveryEvent';
type TMethodPushStat = 'pushStat';
type TMethodSetTags = 'setTags';
type TMethodGetTags = 'getTags';
type TMethodRegisterUser = 'registerUser';
type TMethodPostEvent = 'postEvent';
type TMethodGetInboxMessages = 'getInboxMessages';
type TMethodInboxStatus = 'inboxStatus';
type TMethodPageVisit = 'pageVisit';
type TMethodGetInApps = 'getInApps';

export interface IRequest {
  application: string; // Pushwoosh application code.
  hwid: string; // Unique string to identify the device.
  userId: string; // The user ID to associate with event.
  device_type: number; // 10 - safari, 11 - chrome, 12 - firefox.
  device_model: string; // browser version.
  timezone: number; // Timezone offset in seconds for the device.
  language: string; // Language locale of the device. Must be a lowercase two-letter code according to ISO-639-1 standard.
  v: string; // Web SDK version.
}

interface IRequestGetConfig extends IRequest {
  features: string[]; // array of features names.
}

interface IRequestRegisterDevice extends IRequest {
  push_token: string; // Push token for the device.
  public_key?: string;
  auth_token?: string;
  fcm_push_set?: string;
  fcm_token?: string;
}

interface IRequestRegisterUser extends IRequest {
  ts_offset: number; // Timezone offset in seconds for the device. (aka timezone).
}

interface IRequestPostEvent extends IRequest {
  event: string; // Event name.
  attributes?: { [key: string]: any };
  timestampUTC?: number; // Timestamp in UTC.
  timestampCurrent?: number; // Timestamp in local time.
}

interface IRequestMessageDeliveryEvent extends IRequest {
  hash: string; // message hash
}

interface IRequestPushStat extends IRequest {
  hash: string; // message hash
}

interface IRequestSetTags extends IRequest {
  tags: {
    [key: string]: any
  };
}

interface IRequestGetInboxMessages extends IRequest {
  userId: string;  // use hwid or other custom string if no userId
  last_code: string;  // For pagination purpose. "next" parameter from response. For first request send empty string
  count?: number; // optional, default messages count on page
  last_request_time: number; // for update new messages counter. UTC
}

interface IRequestInboxStatus extends IRequest {
  userId: string;  // use hwid or other custom string if no userId
  inbox_code: string;  // order. Ugly logic for fast development.
  time: number;  // timestamp utc
  status: number,
  hash?: string;  // ??
  device_type: number;  // platform type from Pushwoosh system
}

interface IRequestPageVisit extends IRequest {
  title: string;
  url_path: string;
  url: string;
}

type IResponse = void;

interface IResponseCheckDevice {
  exist: boolean; // exist device token
  push_token_exist: boolean; // exist push token
}

interface IResponseGetConfig {
  features: {
    page_visit?: {
      entrypoint: string;
      enabled: boolean;
    };
    channels?: Array<{ name: string; code: string; position: number }>;
    vapid_key?: string;
    web_in_apps?: {
      enabled: boolean;
    };
    events?: string[];
  }
}

interface IResponseGetTags {
  result: {
    [key: string]: any
  };
}

interface IResponsePostEvent {
  code?: string;
}

interface IResponseGetInboxMessages {
  messages: Array<IInboxMessage>;
  next: string;  // pagination code
  deleted: Array<string>; // array of notifications codes deleted from cp
  new_inbox: number;  // inbox messages created since last request time
}

interface IResponseGetInApps {
  inApps: Array<{
    url: string; // using simple GET request to get content from Pushwoosh server
    code: string; // unique identifier of an In-App
    layout: 'fullscreen' | 'centerbox' | 'topbanner' | 'bottombanner'; // layout format - fullscreen, centerbox, topbanner or bottombanner
    updated: number; // unixtimestamp of last In-App modification
    closeButtonType?: '1'; // if set one need render close button
    hash: string; //zip md5sum since PUSH-10304
    required: boolean; //since PUSH-10660: InApp required for render if already download or not
    priority: string //since PUSH-10660: priority of download rich media
  }>
}


export type TMethod =
  | TMethodCheckDevice
  | TMethodGetConfig
  | TMethodApplicationOpen
  | TMethodRegisterDevice
  | TMethodUnregisterDevice
  | TMethodDeleteDevice
  | TMethodMessageDeliveryEvent
  | TMethodPushStat
  | TMethodSetTags
  | TMethodGetTags
  | TMethodRegisterUser
  | TMethodPostEvent
  | TMethodGetInboxMessages
  | TMethodInboxStatus
  | TMethodPageVisit
  | TMethodGetInApps;

export interface IMapRequest {
  'checkDevice': IRequest;
  'getConfig': IRequestGetConfig;
  'applicationOpen': IRequest;
  'registerDevice': IRequestRegisterDevice;
  'unregisterDevice': IRequest;
  'deleteDevice': IRequest;
  'messageDeliveryEvent': IRequestMessageDeliveryEvent;
  'pushStat': IRequestPushStat;
  'setTags': IRequestSetTags;
  'getTags': IRequest;
  'registerUser': IRequestRegisterUser;
  'postEvent': IRequestPostEvent;
  'getInboxMessages': IRequestGetInboxMessages;
  'inboxStatus': IRequestInboxStatus;
  'pageVisit': IRequestPageVisit;
  'getInApps': IRequest;
}

export interface IMapResponse {
  'checkDevice': IResponseCheckDevice;
  'getConfig': IResponseGetConfig;
  'applicationOpen': IRequest;
  'registerDevice': IResponse;
  'unregisterDevice': IResponse;
  'deleteDevice': IResponse;
  'messageDeliveryEvent': IResponse;
  'pushStat': IResponse;
  'setTags': IResponse;
  'getTags': IResponseGetTags;
  'registerUser': IResponse;
  'postEvent': IResponsePostEvent;
  'getInboxMessages': IResponseGetInboxMessages;
  'inboxStatus': IResponse;
  'pageVisit': IResponse;
  'getInApps': IResponseGetInApps;
}
