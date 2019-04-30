type PushwooshApiResponse = {
  status_code: number,
  status_message: string,
  response?: any
};

type TPWPermission = 'denied' | 'granted' | 'default';

interface IPWDriverAPIParams {
  hwid: string;
  pushToken: string;
  publicKey?: string;
  authToken?: string;
  fcmToken?: string;
  fcmPushSet?: string;
}

interface TPWAPIParams extends IPWDriverAPIParams {
  applicationCode: string;
  pushwooshApiUrl?: string;
  deviceType: number;
  deviceModel: string;
  language: string;
  userId?: string;
}

interface TPWLastOpenMessage {
  messageHash?: string,
  expiry: number,
  url?: string
}

interface PushManager {
  permissionState(options: PushSubscriptionOptions): Promise<TPWPermission>
}

interface PushSubscription {
  unsubscribe(): Promise<boolean>;
  subscriptionId: string
}

interface IPWDriver {
  initWorker?(): Promise<any>;
  getPermission(): Promise<TPWPermission>;
  isSubscribed(): Promise<boolean>;
  askSubscribe(eventEmitter?: any): Promise<any>;
  unsubscribe(): Promise<any>;
  getAPIParams(): Promise<IPWDriverAPIParams>;
  onApiReady?(api: any): void;
  isNeedUnsubscribe?(): Promise<boolean>;
}

interface ServiceWorkerRegistration {
  showNotification(a: any, b: any): Promise<any>;
  readonly periodicSync: SyncManager;
}

interface ITooltipText {
  successSubscribe?: string;
  needSubscribe?: string;
  blockSubscribe?: string;
  alreadySubscribed?: string;
}

interface ISubscribeWidget {
  enable: boolean;
  position?: string,
  bgColor?: string,
  bellColor?: string,
  shadow?: string,
  size?: string,
  indent?: string,
  zIndex?: string,
  tooltipText?: ITooltipText
}

interface ISubscribePopup {
  enable: boolean;
}

type IWidgetPosition = 'left' | 'right' | 'top' | 'bottom';

interface IInboxWidget {
  enable: boolean;
  triggerId?: string;
  position?: IWidgetPosition;
  appendTo?: string;
  title?: string;
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  borderColor?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  widgetWidth?: number;
  zIndex?: number;
  messageTitleColor?: string;
  timeTextColor?: string;
  emptyInboxTitle?: string;
  emptyInboxText?: string;
  emptyInboxIconUrl?: string;
  emptyInboxTitleColor?: string;
  emptyInboxTextColor?: string;
}

interface IInitParams {
  applicationCode: string;
  serviceWorkerUrl?: string | null;
  safariWebsitePushID?: string;
  autoSubscribe?: boolean;
  pushwooshUrl?: string;
  pushwooshApiUrl?: string;
  defaultNotificationImage?: string;
  defaultNotificationTitle?: string;
  logLevel?: string;
  userId?: string;
  scope?: string;
  tags?: {[key: string]: any};
  driversSettings?: {
    worker?: {
      serviceWorkerUrl?: string;
      applicationServerPublicKey?: string;
    }
  };
  subscribeWidget?: ISubscribeWidget;
  inboxWidget?: IInboxWidget;
  subscribePopup?: ISubscribePopup;
}

interface IInitParamsWithDefaults extends IInitParams {
  autoSubscribe: boolean;
  pushwooshUrl: string;
  deviceType: number;
  serviceWorkerUrl: string | null;
  tags: {
    Language: string,
    'Device Model': string,
    [key: string]: any
  };
  driversSettings: {
    worker: {
      serviceWorkerUrl: string;
      applicationServerPublicKey?: string;
    }
  };
  subscribeWidget: ISubscribeWidget;
  inboxWidget: IInboxWidget;
  subscribePopup: ISubscribePopup;
}

interface IPWParams extends IInitParamsWithDefaults {
  applicationCode: string;
  defaultNotificationImage?: string;
  defaultNotificationTitle?: string;
  logLevel?: 'error' | 'info' | 'debug';
  pushwooshApiUrl?: string;
  safariWebsitePushID?: string;
  scope?: string;
  userId?: string;
  pushwooshUrl: string;
  authToken?: string;
  fcmPushSet?: string;
  fcmToken?: string;
  hwid?: string;
  publicKey?: string;
  pushToken?: string;
}

interface INotificationOptions extends ServiceWorkerNotificationOptions {
  title: string,
  messageHash: string,
  duration: number,
  openUrl: string,
  url?: string,
  inboxId: string,

  image?: string,
  code?: string,
  buttons?: INotificationButton[],
  customData?: {[key: string]: any},
  campaignCode?: string
}

type TPWCanWaitCallback = (f: any) => Promise<any> | any;

interface IWorkerPushwooshGlobal {
  push(listener: ['onPush', TPWCanWaitCallback]): void;
  getListeners(eventName: string): TPWCanWaitCallback[];
  api: any;
  initApi: any;
}

interface Window {
  Pushwoosh: IWorkerPushwooshGlobal;
}

interface IPWBroadcastClientsParams {
  type: string;
  payload: any;
}

type TWriteType = 'error' | 'apirequest' | 'info';

interface ILogger {
  setLevel(level: string): void;
  error(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
  write(type: TWriteType, message: any, additional?: any): Promise<void>;
  isManualLevel(): boolean;
  [key: string]: any;
}

type ListenerFn = (...args: Array<any>) => void | Promise<any>;

type HandlerFn = (api: any, params?: any) => any;

type TWorkerDriverParams = {
  eventEmitter?: any,
  scope?: string,
  applicationCode: string,
  serviceWorkerUrl: string | null,
  applicationServerPublicKey?: string,
};

type TWorkerSafariDriverParams = {
  eventEmitter?: any,
  applicationCode: string,
  webSitePushID: string,
  pushwooshUrl: string,
  pushwooshApiUrl?: string
};

type TServiceWorkerClientExtended = ServiceWorkerClient & {
  focus: () => void
};

type TDoPushwooshMethod = (type: string, params: any) => Promise<any>;

type PWInput = PushOnReadyCallback | PushInitCallback | PushEventCallback;
type PushOnReadyCallback = HandlerFn;
type PushInitCallback = ['init', IInitParams];
type PushEventCallback = [PWEvent, HandlerFn];
type PWEvent = 'onReady'
  | 'onSubscribe'
  | 'onUnsubscribe'
  | 'onRegister'
  | 'onSWInitError'
  | 'onPermissionPrompt'
  | 'onPermissionDenied'
  | 'onPermissionGranted'
  | 'onNotificationClick'
  | 'onPushDelivery'
  | 'onNotificationClose'
  | 'onChangeCommunicationEnabled'
  | 'onPutNewMessageToInboxStore'
  | 'onUpdateInboxMessages';

declare const __VERSION__: string;
