import Storage from '../modules/storage/Storage';
import DateModule from '../modules/DateModule';

import { Data } from '../modules/Data/Data';
import { Api } from '../modules/Api/Api';

import InboxMessagesPublic from '../modules/InboxMessagesPublic';

import EventEmitter from '../EventEmitter';
import {EVENT_ON_UPDATE_INBOX_MESSAGES} from '../constants';


export default class InboxMessages {
  data: Data;
  api: Api;
  storage: Storage;
  storeName: TInboxMessagesStoreName;
  dateModule: DateModule;

  constructor(
    data: Data,
    api: Api,
    storage: Storage = new Storage(),
    dateModule: DateModule = new DateModule(),
  ) {
    this.data = data;
    this.api = api;

    this.storage = storage;
    this.storeName = 'inboxMessages';
    this.dateModule = dateModule;
  }

  /**
   * Get inbox messages by api
   */
  private async getInboxMessages(): Promise<IGetInboxMessagesResponse> {
    // get inbox messages
    const response: IGetInboxMessagesResponse = await this.api.getInboxMessages();
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
    await this.data.setInboxLastRequestTime(this.dateModule.getUtcTimestamp());

    await this.data.setInboxLastRequestCode(next);
    await this.data.setInboxNewMessagesCount(newMessagesCount);
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
    const upperBound = this.dateModule.getTimestamp().toString();
    const allMessages = await this.storage
      .getAll<IInboxMessage>(this.storeName);
    const codesToDelete = allMessages
      .filter((msg: IInboxMessage) => msg.rt > upperBound)
      .map(msg => msg.inbox_id);
    return this.deleteMessages(codesToDelete);
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
    const allMessages = await this.storage
      .getAll<IInboxMessage>(this.storeName);
    return allMessages
      .filter((msg: IInboxMessage) => <TInboxMessageStatusRead>msg.status === 2 || <TInboxMessageStatusOpen>msg.status === 3);
  }

  /**
   * Get all unread messages
   */
  async getDeliveredMessages(): Promise<Array<IInboxMessage>> {
    const allMessages = await this.storage
      .getAll<IInboxMessage>(this.storeName);
    return allMessages
      .filter((msg: IInboxMessage) => <TInboxMessageStatusDelivered>msg.status === 1)
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
      eventEmitter.emit(EVENT_ON_UPDATE_INBOX_MESSAGES, new InboxMessagesPublic(
        this.data,
        this.api,
        this
      ));
    }
  }
}

