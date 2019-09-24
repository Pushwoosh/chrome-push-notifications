type TKeyValueStoreName = 'keyValue';
type TMessageLogStoreName = 'messages';
type TMainLogStoreName = 'log';
type TInboxMessagesStoreName = 'inboxMessages';
type TSdkStoreName =  TKeyValueStoreName
  | TMessageLogStoreName
  | TInboxMessagesStoreName
  | TMainLogStoreName;

type TMigrationType = (database: IDBDatabase) => void;

type TMigrationsObjectType = {
  initial: Array<TMigrationType>,
  [date: string]: Array<TMigrationType>  // date in YYYY/MM/DD format
}

interface IIDBOpenEventTargetWithResult extends EventTarget {
  result: IDBDatabase;
}

interface IIDBGetTransactionEventTargetWithResult extends EventTarget {
  result: any;
}


type TIDBKeyType = string | number | Date;
type TIDBQueryValue = TIDBKeyType | IDBKeyRange | IDBArrayKey;

interface IDBIndex {
  getAll(query?: TIDBQueryValue, count?: number): IDBRequest
}

interface IDBObjectStore {
  getAll(query?: TIDBQueryValue, count?: number): IDBRequest
}

// KeyValue Keys

type TIDBAppCodeKey = 'params.applicationCode';
type TIDBApiUrlKey = 'params.apiUrl';
type TIDBHwidKey = 'params.hwid';
type TIDBDefaultNotificationImageKey = 'params.defaultNotificationImage';
type TIDBDefaultNotificationTitleKey = 'params.defaultNotificationTitle';
type TIDBUserIdKey = 'params.userId';
type TIDBUserIdWasChangedKey = 'params.userIdWasChanged';
type TIDBDeviceType = 'params.deviceType';

type TSubscriptionPopupLastOpen = 'params.subscriptionPopupLastOpen';

type TIDBInboxLastRequestCodeKey = 'inbox.lastRequestCode';
type TIDBInboxLastRequestTimeKey = 'inbox.lastRequestTime';
type TIDBInboxNewMessagesCountKey = 'inbox.newMessagesCount';


///////////////////
