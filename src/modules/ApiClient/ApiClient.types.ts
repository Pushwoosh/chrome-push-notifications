type TApiClientMethodNameCheckDevice = 'checkDevice';
type TApiClientMethodNameRegisterDevice = 'registerDevice';
type TApiClientMethodNameUnregisterDevice = 'unregisterDevice';
type TApiClientMethodNameSetBadge = 'setBadge';
type TApiClientMethodNamePushStat = 'pushStat';
type TApiClientMethodNameMessageDeliveryEvent = 'messageDeliveryEvent';
type TApiClientMethodNameSetPurchase = 'setPurchase';
type TApiClientMethodNameSetTags = 'setTags';
type TApiClientMethodNameGetTags = 'getTags';
type TApiClientMethodNameRegisterUser = 'registerUser';
type TApiClientMethodNamePostEvent = 'postEvent';
type TApiClientMethodNameGetNearestZone = 'getNearestZone';
type TApiClientMethodNameGetInboxMessages = 'getInboxMessages';
type TApiClientMethodNameInboxStatus = 'inboxStatus';

export type TApiClientMethods =
  | TApiClientMethodNameCheckDevice
  | TApiClientMethodNameRegisterDevice
  | TApiClientMethodNameUnregisterDevice
  | TApiClientMethodNameSetBadge
  | TApiClientMethodNamePushStat
  | TApiClientMethodNameMessageDeliveryEvent
  | TApiClientMethodNameSetPurchase
  | TApiClientMethodNameSetTags
  | TApiClientMethodNameGetTags
  | TApiClientMethodNameRegisterUser
  | TApiClientMethodNamePostEvent
  | TApiClientMethodNameGetNearestZone
  | TApiClientMethodNameGetInboxMessages
  | TApiClientMethodNameInboxStatus;

interface IRequest {
  application: string,
  hwid: string
}

interface IRequestRegisterDevice extends IRequest {
  push_token: string,
  language?: string,
  timezoneOffset?: number,
  device_type: number
}

interface IRequestSetBadge extends IRequest {
  badge: number
}

interface IRequestPushStat extends IRequest {
  userId?: string,
  hash?: string
}

interface IRequestMessageDeliveryEvent extends IRequest {
  hash?: string
}

interface IRequestSetPurchase extends IRequest {
  transactionDate: string,
  quantity: number,
  currency: string,
  productIdentifier: string,
  price: number
}

interface IRequestSetTags extends IRequest {
  tags: {
    [key: string]: any
  }
}

interface IRequestGetTags extends IRequest {
  userId: string
}

interface IRequestRegisterUser extends IRequest {
  userId: string,
  tz_offset: number,
  deviceType: number
}

interface IRequestPostEvent {
  hwid?: string,
  application: string,
  event: string,
  attributes?: {
    [key: string]: any
  },
  timestampUtc?: number,
  timestampCurrent?: number,
  userId?: string,
  deviceType: number
}

interface IRequestGetNearestZone extends IRequest {
  lat: string,
  lng: string
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
  status: TInboxMessageStatus,
  hash?: string;  // ??
  device_type: number;  // platform type from Pushwoosh system
}

export type IRequestMap = {
  'checkDevice': IRequest,
  'registerDevice': IRequestRegisterDevice,
  'unregisterDevice': IRequest,
  'setBadge': IRequestSetBadge,
  'pushStat': IRequestPushStat,
  'messageDeliveryEvent': IRequestMessageDeliveryEvent,
  'setPurchase': IRequestSetPurchase,
  'setTags': IRequestSetTags,
  'getTags': IRequestGetTags,
  'registerUser': IRequestRegisterUser,
  'postEvent': IRequestPostEvent,
  'getNearestZone': IRequestGetNearestZone,
  'getInboxMessages': IRequestGetInboxMessages,
  'inboxStatus': IRequestInboxStatus
}

interface IResponseCheckDevice {
  exist: boolean,
  push_token_exist: boolean
}

interface IResponseGetTags {
  result: {
    [key: string]: any
  }
}

interface IResponseGetNearestZone {
  name: string,
  lat: number,
  lng: number,
  range: number,
  distance: number
}

interface IResponseGetInboxMessages {
  messages: Array<IInboxMessage>;
  next: string;  // pagination code
  deleted: Array<string>; // array of notifications codes deleted from cp
  new_inbox: number;  // inbox messages created since last request time
}

export type IResponseMap = {
  'checkDevice': IResponseCheckDevice,
  'registerDevice': null,
  'unregisterDevice': null,
  'setBadge': undefined,
  'pushStat': null,
  'messageDeliveryEvent': null,
  'setPurchase': null,
  'setTags': null,
  'getTags': IResponseGetTags,
  'registerUser': null,
  'postEvent': IRequestPostEvent,
  'getNearestZone': IResponseGetNearestZone,
  'getInboxMessages': IResponseGetInboxMessages,
  'inboxStatus': undefined
}
