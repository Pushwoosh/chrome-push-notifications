export interface IPushServiceSubscriptionKeys {
  pushToken?: string;
  publicKey?: string;
  authToken?: string;
  fcmToken?: string;
  fcmPushSet?: string;
  endpoint?: string;
}

export abstract class IPushService {
  /**
   * Get current status of permission for send notifications.
   *
   * @return { NotificationPermission }
   */
  public abstract getPermission(): NotificationPermission;

  /**
   * Check is permission granted.
   *
   * @return { boolean }
   */
  public abstract checkIsPermissionGranted(): boolean;

  /**
   * Check is permission default.
   *
   * @return { boolean }
   */
  public abstract checkIsPermissionDefault(): boolean;

  /**
   * Check is manual unsubscribed for push notifications.
   */
  public abstract async checkIsManualUnsubscribed(): Promise<boolean>;

  /**
   * Request permission for send notifications.
   *
   * @return { Promise<void> }
   */
  public abstract async askPermission(): Promise<void>;

  /**
   * Get subscription keys for send push notifications.
   *
   * @return { Promise<IPushServiceSubscriptionKeys> }
   */
  public abstract async getTokens(): Promise<IPushServiceSubscriptionKeys>

  /**
   * Subscribe for push notifications.
   *
   * @return { Promise<void> }
   */
  public abstract async subscribe(): Promise<void>;

  /**
   * Unsubscribe for push notifications.
   *
   * @return { Promise<void> }
   */
  public abstract async unsubscribe(): Promise<void>;

  /**
   * Check can receive notifications from Pushwoosh.
   *
   * @return { Promise<boolean> }
   */
  public abstract async checkIsRegister(): Promise<boolean>;

  /**
   * Check is change sender configuration
   */
  public abstract async checkIsNeedResubscribe(): Promise<boolean>;
}
