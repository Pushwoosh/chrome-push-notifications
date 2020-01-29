import {default as InboxMessagesModel} from '../models/InboxMessages';
import DateModule from './DateModule';
import { Api } from './Api/Api';
import { Data } from './Data/Data';


export default class InboxMessages implements IInboxMessages {
  private readonly data: Data;
  private readonly api: Api;
  private readonly inboxModel: InboxMessagesModel;
  private dateModule: DateModule;

  constructor(
    data: Data,
    api: Api,
    inboxModel: InboxMessagesModel,
    dateModule: DateModule = new DateModule(),
  ) {
    this.data = data;
    this.api = api;
    this.inboxModel = inboxModel;
    this.dateModule = dateModule;

    this.publicMessageBuilder = this.publicMessageBuilder.bind(this);
  }

  /**
   * Get message type by IInboxMessageActionParams
   * @param actionParams
   */
  private messageTypeFactory(actionParams: IInboxMessageActionParams): TInboxMessageType {
    let messageType: TInboxMessageTypePlain = 0;
    // 'h', 'rm', 'r' - Richmedia params
    if ('h' in actionParams
      || 'rm' in actionParams
      || 'r' in actionParams) {
      (<TInboxMessageTypeRichmedia>messageType) = 1;
    }
    // 'l' - URL and deeplink parameter
    else if ('l' in actionParams && actionParams.l !== undefined) {
      // Deeplink parameter - relative URL; URL parameter - full URL
      if (actionParams.l.startsWith('http')) {
        (<TInboxMessageTypeURL>messageType) = 2;
      }
      else {
        (<TInboxMessageTypeDeeplink>messageType) = 3;
      }
    }

    return messageType;
  }

  /**
   * Update messages status using codes from arguments
   * @param codes
   * @param messages
   * @param status
   */
  private async updateMessagesStatusWithCodes(
    codes: Array<string>,
    messages: Array<IInboxMessage>,
    status: TInboxMessageStatus
  ): Promise<void> {
    const updatedMessages: Array<IInboxMessage> = [];
    const inboxStatusQueries: Array<Promise<void>> = [];

    messages.forEach(async msg => {
      if (codes.indexOf(msg.inbox_id) === -1) {
        return;
      }

      msg.status = status;
      updatedMessages.push(msg);

      // Set inbox status to server
      inboxStatusQueries.push(this.api.inboxStatus(msg.order, msg.status));
    });

    await this.inboxModel.putBulkMessages(updatedMessages);
    await Promise.all(inboxStatusQueries);
  }

  /**
   * Build TInboxMessagePublic by TInboxMessage
   * @param message
   */
  async publicMessageBuilder(message: IInboxMessage): Promise<IInboxMessagePublic> {
    const imageUrl = message.image || await this.data.getDefaultNotificationImage();
    const title = message.title || await this.data.getDefaultNotificationTitle();
    this.dateModule.date = new Date(parseInt(message.send_date) * 1000);
    this.dateModule.setLocal();

    return {
      title,
      imageUrl,
      code: message.inbox_id,
      message: message.text,
      sendDate: this.dateModule.date.toISOString(),
      type: this.messageTypeFactory(JSON.parse(message.action_params)),
      isRead: <TInboxMessageStatusRead>message.status === 2 || <TInboxMessageStatusOpen>message.status === 3,
      isActionPerformed: <TInboxMessageStatusOpen>message.status === 3
    };
  }

  /**
   * Count of messages with no action performed
   */
  messagesWithNoActionPerformedCount(): Promise<number> {
    return this.inboxModel.getDeliveredReadMessagesCount();
  }

  /**
   * All unread messages
   */
  unreadMessagesCount() {
    return this.inboxModel.getDeliveredMessagesCount();
  }

  /**
   * All messages count
   */
  messagesCount(): Promise<number> {
    return this.inboxModel.messagesCount();
  }

  /**
   * Get all active messages
   */
  async loadMessages(): Promise<Array<IInboxMessagePublic>> {
    const readMessages = await this.inboxModel.getReadOpenMessages();
    const unreadMessages = await this.inboxModel.getDeliveredMessages();
    const buildMessagePromises = [...readMessages, ...unreadMessages]
      .sort((msgA: IInboxMessage, msgB: IInboxMessage) => {  // sort by send date
        return parseInt(msgB.send_date, 10) - parseInt(msgA.send_date, 10);
      })
      .sort((msgA: IInboxMessage, msgB: IInboxMessage) => {  // sort by order
        return parseInt(msgB.order || '0', 10) - parseInt(msgA.order || '0', 10);
      })
      .map(this.publicMessageBuilder);
    return Promise.all(buildMessagePromises);
  }

  /**
   * Mark messages as read
   * @param codes
   */
  async readMessagesWithCodes(codes: Array<string>): Promise<void> {
    const unreadMessages = await this.inboxModel.getDeliveredMessages();

    const statusRead: TInboxMessageStatusRead = 2;
    await this.updateMessagesStatusWithCodes(
      codes,
      unreadMessages,
      statusRead
    );
  }

  /**
   * Execute message action. Type "richmedia" and "plain" does not support
   * @param code
   */
  async performActionForMessageWithCode(code: string): Promise<void> {
    const message = await this.inboxModel.getMessage(code);
    const actionParams = JSON.parse(message.action_params);
    const messageType = this.messageTypeFactory(actionParams);

    if (<TInboxMessageTypeURL>messageType === 2 && actionParams.l !== undefined) {
      document.location.href = actionParams.l;
    }
    else if (<TInboxMessageTypeDeeplink>messageType === 3 && actionParams.l !== undefined) {
      window.history.go(actionParams.l);
    }

    (<TInboxMessageStatusOpen>message.status) = 3;
    await this.inboxModel.putMessage(message);

    // Set inbox status to server
    await this.api.inboxStatus(message.order, message.status);
  }

  /**
   * Delete messages by codes
   * @param codes
   */
  async deleteMessagesWithCodes(codes: Array<string>): Promise<void> {
    const readMessages = await this.inboxModel.getReadOpenMessages();
    const unreadMessages = await this.inboxModel.getDeliveredMessages();

    const statusDeleted: TInboxMessageStatusDeleted = 4;
    await this.updateMessagesStatusWithCodes(
      codes,
      [...readMessages, ...unreadMessages],
      statusDeleted
    );
  }

  /**
   * Sync inbox messages with server
   */
  async syncMessages() {
    await this.inboxModel.updateMessages();
  }
}
