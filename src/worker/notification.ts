import {
  WAKE_UP_SERVICE_WORKER_INTERVAL,
  MIN_NOTIFICATION_DURATION
} from '../constants';
export default class PushwooshNotification {
  private _canceled = false;

  private readonly showNotificationOptions: IShowNotificationOptions;
  private readonly duration: number;
  private readonly body: string;
  private readonly title: string;

  constructor(
    showNotificationOptions: IShowNotificationOptions,
    duration: number,
    body: string,
    title: string
  ) {
    this.showNotificationOptions = showNotificationOptions;
    this.duration = duration;
    this.body = body;
    this.title = title;
  }

  async show() {
    if (this._canceled) {
      return;
    }

    const showNotificationOptions = this.showNotificationOptions;
    if (!showNotificationOptions.silent) {
      await self.registration.showNotification(this.title, showNotificationOptions);
    }

    if (this.duration >= MIN_NOTIFICATION_DURATION) {
      const notifications = await self.registration.getNotifications();
      const count = Math.floor(this.duration / WAKE_UP_SERVICE_WORKER_INTERVAL);
      this.wakeUpServiceWorker(count, this.body);

      notifications.forEach(notification => {
        if (notification.data && notification.data.code === this.showNotificationOptions.data.code) {
          setTimeout(() => {
            notification.close();
          }, 1000 * this.duration);
        }
      });
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
}

