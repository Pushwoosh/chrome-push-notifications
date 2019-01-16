import {
  DEFAULT_NOTIFICATION_DURATION,
  MAX_NOTIFICATION_DURATION,
  MIN_NOTIFICATION_DURATION
} from '../constants';
import Params from '../modules/data/Params';
import DateModule from '../modules/DateModule';
import {parseSerializedNotificationParams} from '../functions';


/**
 * Build notification payload for different usage (show notification, use in sdk, inbox messages)
 */
export default class NotificationPayload {
  payload: INotificationPayload;
  params: Params;
  code: string;
  dateModule: DateModule;

  constructor(
    payload: INotificationPayload | IChromeNotificationPayload,
    params: Params = new Params(),
    dateModule: DateModule = new DateModule()
  ) {
    // Set payload
    if ('data' in payload) {
      const chromePayload = <IChromeNotificationPayload>payload;
      this.payload = chromePayload.data;
    }
    else {
      this.payload = <INotificationPayload>payload;
    }

    this.params = params;
    this.code = `notificationCode-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    this.dateModule = dateModule;
  }

  async getIcon(): Promise<string> {
    return this.payload.i || await this.params.defaultNotificationImage;
  }

  async getTitle(): Promise<string> {
    return this.payload.header || await this.params.defaultNotificationTitle;
  }

  get body(): string {
    return this.payload.body;
  }

  get messageHash(): string {
    return this.payload.p;
  }

  get image(): string {
    return this.payload.image || '';
  }

  get buttons(): Array<INotificationButton> {
    return this.payload.buttons
      ? parseSerializedNotificationParams(this.payload.buttons)
      : [];
  }

  get customData(): {[key: string]: any} {
    return this.payload.u
      ? parseSerializedNotificationParams(this.payload.u)
      : {};
  }

  get campaignCode(): string {
    return this.payload.pwcid || '';
  }

  get duration(): number {
    const duration = this.payload.duration
      ? Math.abs(parseInt(this.payload.duration, 10))
      : DEFAULT_NOTIFICATION_DURATION;

    if (isNaN(duration)) {
      return DEFAULT_NOTIFICATION_DURATION;
    }

    return Math.min(MAX_NOTIFICATION_DURATION, duration);
  }

  get link(): string {
    return this.payload.l || '/';
  }

  get inboxId(): string {
    return this.payload.pw_inbox || '';
  }

  get inboxParams(): INotificationPayloadInboxParams {
    // Parse inbox params
    if (this.payload.inbox_params) {
      return parseSerializedNotificationParams(this.payload.inbox_params);
    }

    return {};
  }

  get inboxRemovalTime(): string {
    if (this.inboxParams && this.inboxParams.rt) {
      return this.inboxParams.rt;
    }

    this.dateModule.date = new Date();
    this.dateModule.addDays(1);  // one day removal time
    return this.dateModule.getUtcTimestamp().toString();
  }

  async getInboxImage(): Promise<string> {
    if (this.inboxParams && this.inboxParams.image) {
      return this.inboxParams.image;
    }

    return '';
  }

  get rootParams(): {[key: string]: any} {
    const {
      body,
      p,
      header,
      duration,
      i,
      u,
      l,
      pwcid,
      image,
      buttons,
      pw_inbox,
      inbox_params,
      ...rootParams
    } = this.payload;
    return rootParams;
  }


  async getNotificationOptionsPayload(): Promise<INotificationOptionsPayload> {
    const title = await this.getTitle();
    const icon = await this.getIcon();

    return {
      ...this.rootParams,
      body: this.body,
      title,
      icon,
      image: this.image,
      buttons: this.buttons,
      customData: this.customData,
      campaignCode: this.campaignCode,
      duration: this.duration,
      openUrl: this.link,
      messageHash: this.messageHash
    }
  }

  async getShowNotificationOptions(): Promise<IShowNotificationOptions> {
    const icon = await this.getIcon();

    const buttons = this.buttons.map((button: INotificationButton, key: number) => {
      button.action = `action-${key}`;
      return button;
    });

    const requireInteraction = this.duration === 0 || this.duration > MIN_NOTIFICATION_DURATION;
    return {
      ...this.rootParams,
      body: this.body,
      icon,
      requireInteraction,
      tag: JSON.stringify({
        url: this.link,
        messageHash: this.messageHash,
        customData: this.customData
      }),
      data: {
        code: this.code,
        buttons,
        duration: this.duration,
        image: this.image,
        campaignCode: this.campaignCode,
        inboxId: this.inboxId
      },
      actions: buttons,
      image: this.image,
      buttons  // old notification api artifact
    };
  }

  async getInboxMessage(): Promise<IInboxMessage> {
    this.dateModule.date = new Date();
    const sendDate = this.dateModule.getTimestamp().toString();
    const title = this.payload.header || '';
    const image = await this.getInboxImage();
    const actionType: TInboxActionUrl = 'URL';
    const status: TInboxMessageStatusDelivered = 1;

    return {
      title,
      image,
      status,
      order: this.dateModule.getInboxFakeOrder(),
      inbox_id: this.inboxId,
      send_date: sendDate,
      rt: this.inboxRemovalTime,
      text: this.body,
      action_type: actionType,
      action_params: JSON.stringify({
        l: this.link
      })
    }
  }
}
