import Storage from '../modules/storage/Storage';
import Params from '../modules/data/Params';
import InboxParams from '../modules/data/InboxParams';
import DateModule from '../modules/DateModule';
import ApiClient from '../modules/api/ApiClient';
import PayloadBuilder from '../modules/api/PayloadBuilder';

import InboxMessagesPublic from '../modules/InboxMessagesPublic';

import EventEmitter from '../EventEmitter';
import {EVENT_ON_UPDATE_INBOX_MESSAGES} from '../constants';


export default class InboxMessages {
  storage: Storage;
  storeName: TInboxMessagesStoreName;
  params: Params;
  inboxParams: InboxParams;
  dateModule: DateModule;
  apiClient: ApiClient;
  payloadBuilder: PayloadBuilder;

  constructor(
    storage: Storage = new Storage(),
    params: Params = new Params(),
    inboxParams: InboxParams = new InboxParams(),
    dateModule: DateModule = new DateModule(),
    apiClient: ApiClient = new ApiClient(),
    payloadBuilder: PayloadBuilder = new PayloadBuilder()
  ) {
    this.storage = storage;
    this.storeName = 'inboxMessages';

    this.params = params;
    this.inboxParams = inboxParams;
    this.dateModule = dateModule;
    this.payloadBuilder = payloadBuilder;
    this.apiClient = apiClient;
  }

  /**
   * Get inbox messages by api
   */
  private async getInboxMessages(): Promise<IGetInboxMessagesResponse> {
    // get inbox messages
    const payload = await this.payloadBuilder.getInboxMessages();
    const response: IGetInboxMessagesResponse = await this.apiClient.getInboxMessages(payload);
    await this.storeGetInboxMessagesRequestParams(response.next, response.new_inbox);

    return response;
  }

  /**
   * Store parameters for next getInboxMessages request
   * @param next
   * @param newMessagesCount
   */
  private async storeGetInboxMessagesRequestParams(next: string, newMessagesCount: number): Promise<void> {
    this.dateModule.date = new Date();
    await this.inboxParams.setLastRequestTime(this.dateModule.getUtcTimestamp());

    await this.inboxParams.setLastRequestCode(next);
    await this.inboxParams.setNewMessagesCount(newMessagesCount);
  }

  /**
   * Put loaded messages. Add delete status to loaded messages if this status set locally.
   * @param messages
   */
  private async putServerMessages(messages: Array<IInboxMessage>): Promise<Array<string>> {
    const putTransactions = messages.map(async (message: IInboxMessage) => {
      const localMessage = await this.storage.get<IInboxMessage, {}>(this.storeName, message.inbox_id, {});
      if ('status' in localMessage) {
        message.status = localMessage.status;
      }
      return this.putMessage(message);
    });

    return Promise.all(putTransactions);
  }

  /**
   * Create or update inbox message
   */
  putMessage(message: IInboxMessage): Promise<string> {
    return <Promise<string>>this.storage.put(this.storeName, message);
  }

  /**
   * Create or update messages pack
   * @param messages
   */
  putBulkMessages(messages: Array<IInboxMessage>): Promise<Array<string>> {
    const putTransactions = messages.map(message => this.putMessage(message));
    return Promise.all(putTransactions);
  }

  /**
   * Delete messages by codes
   * @param codes
   */
  deleteMessages(codes: Array<string>): Promise<Array<void>> {
    const deleteTransactions = codes.map(code => this.storage.delete(this.storeName, code));
    return Promise.all(deleteTransactions);
  }

  /**
   * Delete expired by removal time messages
   */
  async deleteExpiredMessages(): Promise<Array<void>> {
    this.dateModule.date = new Date();
    const keyRange = IDBKeyRange.upperBound(this.dateModule.getTimestamp().toString());

    const removalTimeIndex: TInboxMessagesIDBRemovalTimeIndex = 'rt';
    const expiredMessages = await this.storage.getAllByIndex<Array<IInboxMessage>, Array<IInboxMessage>>(this.storeName, removalTimeIndex, keyRange, []);
    const deleteCodes = expiredMessages.map(expiredMessage => expiredMessage.inbox_id);
    return this.deleteMessages(deleteCodes);
  }

  /**
   * Get message by code
   * @param code - inbox_id
   */
  getMessage(code: string): Promise<IInboxMessage> {
    return this.storage.get<IInboxMessage, IInboxMessage>(this.storeName, code);
  }

  /**
   * Get all read messages
   */
  async getReadOpenMessages(): Promise<Array<IInboxMessage>> {
    const [readStatus, openStatus]: TReadInboxMessagesStatusRange = [2, 3];
    const keyRange = IDBKeyRange.bound(readStatus, openStatus);
    const statusIndexName: TInboxMessagesIDBStatusIndex = 'status';

    return this.storage
      .getAllByIndex<Array<IInboxMessage>, Array<IInboxMessage>>(this.storeName, statusIndexName, keyRange, []);
  }

  /**
   * Get all unread messages
   */
  async getDeliveredMessages(): Promise<Array<IInboxMessage>> {
    const deliveredStatus: TInboxMessageStatusDelivered = 1;
    const statusIndexName: TInboxMessagesIDBStatusIndex = 'status';

    return this.storage
      .getAllByIndex<Array<IInboxMessage>, Array<IInboxMessage>>(this.storeName, statusIndexName, deliveredStatus, []);
  }

  /**
   * All messages count
   */
  async messagesCount(): Promise<number> {
    return this.storage.count(this.storeName);
  }

  /**
   * Get count of messages with status "Delivered"
   */
  async getDeliveredMessagesCount(): Promise<number> {
    const deliveredStatus: TInboxMessageStatusDelivered = 1;
    const statusIndexName: TInboxMessagesIDBStatusIndex = 'status';
    return this.storage
      .countByIndex(this.storeName, statusIndexName, deliveredStatus);
  }

  /**
   * Get count of messages with status "Read"
   */
  async getReadMessagesCount(): Promise<number> {
    const readStatus: TInboxMessageStatusRead = 2;
    const statusIndexName: TInboxMessagesIDBStatusIndex = 'status';
    return this.storage
      .countByIndex(this.storeName, statusIndexName, readStatus);
  }

  /**
   * Get count of messages with status "Delivered" and "Read"
   */
  async getDeliveredReadMessagesCount(): Promise<number> {
    const [readStatus, openStatus]: TReadInboxMessagesStatusRange = [2, 3];
    const keyRange = IDBKeyRange.bound(readStatus, openStatus);
    const statusIndexName: TInboxMessagesIDBStatusIndex = 'status';

    return this.storage.countByIndex(this.storeName, statusIndexName, keyRange);
  }

  /**
   * Load messages and sync with locally
   */
  async updateMessages(eventEmitter?: EventEmitter): Promise<void> {
    const response = await this.getInboxMessages();

    await this.deleteExpiredMessages();
    await this.deleteMessages(response.deleted);  // deleted from cp
    await this.putServerMessages(response.messages);

    if (eventEmitter) {
      eventEmitter.emit(EVENT_ON_UPDATE_INBOX_MESSAGES, new InboxMessagesPublic());
    }
  }
}

