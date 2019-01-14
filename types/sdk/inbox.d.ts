// Action types
type TInboxActionUrl = 'URL';
type TInboxActionRichMedia = 'RichMedia';
type TInboxActionDeepLink = 'DeepLink';
type TInboxActionType =  TInboxActionUrl | TInboxActionRichMedia | TInboxActionDeepLink;

// Statuses
type TInboxMessageStatusDelivered = 1;
type TInboxMessageStatusRead = 2;  // set on message in viewport
type TInboxMessageStatusOpen = 3;  // set on message click
type TInboxMessageStatusDeleted = 4;  // set on message delete or expiry removal time
type TInboxMessageStatus = TInboxMessageStatusDelivered
  | TInboxMessageStatusRead
  | TInboxMessageStatusOpen
  | TInboxMessageStatusDeleted;
type TReadInboxMessagesStatusRange = [TInboxMessageStatusRead, TInboxMessageStatusOpen];  // all inbox read messages

// Message
interface IInboxMessageActionParams {
  l?: string;
  rm?: string;
  h?: string;
  r?: string;
}

interface IInboxMessage {
  inbox_id: string;  // inbox message id
  order: string;  // id for ordering in inbox
  rt: string;  // timestamp. Remove date. UTC
  send_date: string;  // timestamp. UTC
  title: string;
  image: string;
  text: string;
  action_type: TInboxActionType;
  action_params: string; // json string with IInboxMessageActionParams
  status: TInboxMessageStatus;
}

// Inbox API types
interface IGetInboxMessagesRequest {
  application: string;  // application code
  userId: string;  // use hwid or other custom string if no userId
  hwid: string;
  last_code: string;  // For pagination purpose. "next" parameter from response. For first request send empty string
  count?: number; //optional, default messages count on page
  last_request_time: number; // for update new messages counter. UTC
}

interface IGetInboxMessagesResponse {
  messages: Array<IInboxMessage>;
  next: string;  // pagination code
  deleted: Array<string>; // array of notifications codes deleted from cp
  new_inbox: number;  // inbox messages created since last request time
}

interface IInboxStatusRequest {
  userId: string;  // use hwid or other custom string if no userId
  hwid: string;  // hwid
  application: string;  // app code
  inbox_code: string;  // order. Ugly logic for fast development.
  time: number;  // timestamp utc
  status: TInboxMessageStatus,
  hash?: string;  // ??
  device_type: number;  // platform type from Pushwoosh system
}

type TGetInboxMessagesMethod = 'getInboxMessages';
type TInboxStatusMethod = 'inboxStatus';

// IndexedDB keys/indexes
type TInboxMessagesIDBKeyPath = 'inbox_id';
type TInboxMessagesIDBStatusIndex = 'status';
type TInboxMessagesIDBRemovalTimeIndex = 'rt';


// Public Interface

type TInboxMessageTypePlain = 0;
type TInboxMessageTypeRichmedia = 1;
type TInboxMessageTypeURL = 2;
type TInboxMessageTypeDeeplink = 3;
type TInboxMessageType = TInboxMessageTypePlain  // depend from action_params
  | TInboxMessageTypeRichmedia
  | TInboxMessageTypeURL
  | TInboxMessageTypeDeeplink;


interface IInboxMessagePublic {
  code: string;  // inbox_id
  title: string;  // title
  message: string; // body
  imageUrl: string;  // image
  sendDate: string;  // send_date
  type: TInboxMessageType;  // depend from action_params
  isRead: boolean;  // true if status read or open
  isActionPerformed: boolean;  // true if status open
}

interface IInboxMessages {
  messagesWithNoActionPerformedCount(): Promise<number>;  // opened messages count
  unreadMessagesCount(): Promise<number>;  // read messages count
  messagesCount(): Promise<number>;  // all messages count
  loadMessages(): Promise<Array<IInboxMessagePublic>>;  // all messages
  readMessagesWithCodes(codes: Array<string>): Promise<void>;  // set read status to messages by code
  performActionForMessageWithCode(code: string): Promise<void>;  // call message action. Set open status to messages
  deleteMessagesWithCodes(codes: Array<string>): Promise<void>;  // Set delete status to messages by code

  publicMessageBuilder(message: IInboxMessage): Promise<IInboxMessagePublic>;  // build public inbox message from base inbox message
}
