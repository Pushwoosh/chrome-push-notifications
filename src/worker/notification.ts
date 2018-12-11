import {
  WAKE_UP_SERVICE_WORKER_INTERVAL,
  MIN_NOTIFICATION_DURATION
} from '../constants';
export default class PushwooshNotification {
  private _origMess: INotificationOptions;
  private _changedMess: INotificationOptions;
  private _canceled = false;

  constructor(info: INotificationOptions) {
    this._origMess = info;
    this._changedMess = {...info};
  }

  get title() {
    return this._changedMess.title;
  }
  set title(title: string) {
    this._changedMess.title = title;
  }

  get body() {
    return this._changedMess.body || '';
  }
  set body(body: string) {
    this._changedMess.body = body;
  }

  get icon() {
    return this._changedMess.icon;
  }
  set icon(icon) {
    this._changedMess.icon = icon;
  }

  get openUrl() {
    return this._changedMess.openUrl;
  }
  set openUrl(openUrl) {
    this._changedMess.openUrl = openUrl;
  }

  get duration() {
    return this._changedMess.duration;
  }
  set duration(duration) {
    this._changedMess.duration = duration;
  }

  get messageHash() {
    return this._changedMess.messageHash;
  }
  set messageHash(messageHash) {
    this._changedMess.messageHash = messageHash;
  }

  get customData() {
    return this._changedMess.customData;
  }
  set customData(customData) {
    this._changedMess.customData = customData;
  }

  get campaignCode() {
    return this._changedMess.campaignCode
  }
  set campaignCode(campaignCode) {
    this._changedMess.campaignCode = campaignCode;
  }

  get badge() {
    return this._changedMess.badge;
  }
  set badge(badge) {
    this._changedMess.badge = badge;
  }

  async show() {
    if (!this._canceled) {
      const code = `notificationCode-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
      const {image} = this._changedMess;
      let {buttons} = this._changedMess;

      if (buttons && Array.isArray(buttons)) {
        buttons.forEach((button: TNotificationButton, key: number) => {
          button.action = `action-${key}`
        });
      }
      const requireInteraction = this.duration === 0 || this.duration > MIN_NOTIFICATION_DURATION;
      const notificationOptions = {
        body: this.body,
        icon: this.icon,
        requireInteraction,
        tag: JSON.stringify({
          url: this.openUrl,
          messageHash: this.messageHash,
          customData: this.customData
        }),
        data: {
          code,
          buttons,
          duration: this.duration,
          image,
          campaignCode: this.campaignCode
        },
        actions: buttons,
        image,
        badge: this.badge
      };
      await self.registration.showNotification(this.title, notificationOptions);

      if (this.duration > MIN_NOTIFICATION_DURATION) {
        const notifications = await self.registration.getNotifications();
        const count = Math.floor(this.duration / WAKE_UP_SERVICE_WORKER_INTERVAL);
        this.wakeUpServiceWorker(count, this.body);

        notifications.forEach(notification => {
          if (notification.data && notification.data.code === code) {
            setTimeout(() => {
              notification.close();
            }, 1000 * this.duration);
          }
        });
      }
    }
  }

  wakeUpServiceWorker(count: number, body: string) {
    count -= 1;
    if (count > 0) {
      setTimeout(() => {
        if (self.registration.active) {
          self.registration.active.postMessage('' + count);
          this.wakeUpServiceWorker(count, body);
        }
      }, WAKE_UP_SERVICE_WORKER_INTERVAL * 1000);
    }
  }

  cancel() {
    this._canceled = true;
  }

  _forLog() {
    return {
      orig: this._origMess,
      changed: this._changedMess,
      canceled: this._canceled,
    };
  }
}

