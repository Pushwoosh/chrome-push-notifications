import {keyValue} from '../../storage';


export default class InboxParams {
  // getInboxMessage last_code param
  get lastRequestCode(): Promise<string> {
    return keyValue.get<TIDBInboxLastRequestCodeKey, string>('inbox.lastRequestCode', '');
  }

  setLastRequestCode(lastCode: string): Promise<void> {
    return keyValue.set<TIDBInboxLastRequestCodeKey, string>('inbox.lastRequestCode', lastCode);
  }

  // getInboxMessages last_request_time
  get lastRequestTime(): Promise<number> {
    return keyValue.get<TIDBInboxLastRequestTimeKey, number>('inbox.lastRequestTime', 0);
  }

  setLastRequestTime(lastRequestTime: number): Promise<void> {
    return keyValue.set<TIDBInboxLastRequestTimeKey, number>('inbox.lastRequestTime', lastRequestTime);
  }

  // new messages count
  get newMessagesCount(): Promise<number> {
    return keyValue.get<TIDBInboxNewMessagesCountKey, number>('inbox.newMessagesCount', 0);
  }

  setNewMessagesCount(count: number): Promise<void> {
    return keyValue.set<TIDBInboxNewMessagesCountKey, number>('inbox.newMessagesCount', count);
  }

}
