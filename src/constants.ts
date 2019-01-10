export const DEFAULT_SERVICE_WORKER_URL = 'pushwoosh-service-worker.js';

export const PERIOD_SEND_APP_OPEN = 3600000;
export const PERIOD_GOAL_EVENT = 86400000;
export const DEFAULT_NOTIFICATION_DURATION = 10;
export const MIN_NOTIFICATION_DURATION = 10; // The min time when the interaction buttons will be displayed
export const MAX_NOTIFICATION_DURATION = 90; // Service worker dies if he pokes more than 110 seconds
export const WAKE_UP_SERVICE_WORKER_INTERVAL = 20; // seconds

export const DEFAULT_NOTIFICATION_TITLE = 'Pushwoosh notification';
export const DEFAULT_NOTIFICATION_IMAGE = 'https://cp.pushwoosh.com/img/logo-medium.png';
export const DEFAULT_NOTIFICATION_URL = '/';

// Keys
export const KEY_API_PARAMS = 'API_PARAMS';
export const KEY_INIT_PARAMS = 'INIT_PARAMS';
export const KEY_SDK_VERSION = 'SDK_VERSION';
export const KEY_WORKER_VERSION = 'WORKER_VERSION';
export const KEY_LAST_SENT_APP_OPEN = 'LAST_SENT_APP_OPEN';
export const KEY_LAST_OPEN_MESSAGE = 'LAST_OPEN_MESSAGE';
export const KEY_API_BASE_URL = 'API_BASE_URL';
export const KEY_SHOW_SUBSCRIBE_WIDGET = 'WIDGET_SHOWED';
export const KEY_CLICK_SUBSCRIBE_WIDGET = 'WIDGET_CLICKED';
export const KEY_DELAYED_EVENT = 'DELAYED_EVENT';
export const KEY_COMMUNICATION_ENABLED = 'COMMUNICATION_ENABLED';
export const KEY_DEVICE_DATA_REMOVED = 'DEVICE_DATA_REMOVED';
export const KEY_INTERNAL_EVENTS = 'INTERNAL_EVENTS';
export const KEY_UNSUBSCRIBED_DUE_TO_UNDEFINED_KEYS = 'UNSUBSCRIBED_DUE_TO_UNDEFINED_KEYS';

// Local storage keys
export const KEY_FAKE_PUSH_TOKEN = 'fakePushToken';
export const KEY_DEVICE_REGISTRATION_STATUS: string = 'deviceRegistrationStatus';
export const KEY_SAFARI_PREVIOUS_PERMISSION = 'safariPreviousPermission';
export const MANUAL_SET_LOGGER_LEVEL = 'PW_SET_LOGGER_LEVEL';

// Device registration status
export const DEVICE_REGISTRATION_STATUS_REGISTERED: string = 'registered';
export const DEVICE_REGISTRATION_STATUS_UNREGISTERED: string = 'unregistered';

// GCM Sender ID
export const KEY_SENDER_ID = 'GCM_SENDER_ID';
export const KEY_FCM_SUBSCRIPTION = 'FCM_SUBSCRIPTION';

// Permissions
export const PERMISSION_DENIED = 'denied';
export const PERMISSION_GRANTED = 'granted';
export const PERMISSION_PROMPT = 'default';

// Events
export const EVENT_ON_READY = 'onReady';
export const EVENT_ON_SUBSCRIBE = 'onSubscribe';
export const EVENT_ON_UNSUBSCRIBE = 'onUnsubscribe';
export const EVENT_ON_REGISTER = 'onRegister';
export const EVENT_ON_PERMISSION_PROMPT = 'onPermissionPrompt';
export const EVENT_ON_PERMISSION_DENIED = 'onPermissionDenied';
export const EVENT_ON_PERMISSION_GRANTED = 'onPermissionGranted';
export const EVENT_ON_SW_INIT_ERROR = 'onSWInitError';
export const EVENT_ON_PUSH_DELIVERY = 'onPushDelivery';
export const EVENT_ON_NOTIFICATION_CLICK = 'onNotificationClick';
export const EVENT_ON_NOTIFICATION_CLOSE = 'onNotificationClose';
export const EVENT_ON_CHANGE_COMMUNICATION_ENABLED = 'onChangeCommunicationEnabled';
export const EVENT_ON_PUT_NEW_MESSAGE_TO_INBOX_STORE = 'onPutNewMessageToInboxStore';
export const EVENT_ON_UPDATE_INBOX_MESSAGES = 'onUpdateInboxMessages';

// Post Events
export const EVENT_SHOW_SUBSCRIBE_BUTTON = 'showSubscribeButton';
export const EVENT_CLICK_SUBSCRIBE_BUTTON = 'clickSubscribeButton';
export const EVENT_GDPR_CONSENT = 'GDPRConsent';
export const EVENT_GDPR_DELETE = 'GDPRDelete';
