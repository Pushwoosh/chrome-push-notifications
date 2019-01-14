interface INotificationPayloadInboxParams {
  image?: string;  // custom icon for inbox message
  rt?: string;  // removal time. YYYY-MM-DD HH:mm
}

interface INotificationPayload {
  body: string;  // message text
  p: string;  // message hash
  header?: string;  // message title
  duration?: string;  // required for chrome/opera
  i?: string;  // icon
  u?: string;  // custom data json string
  l?: string;  // deep link or URL
  pwcid?: string;  // campaign id
  image?: string;  // chrome big image
  buttons?: string;   // button json string. XMPP Chrome Sender payload contains buttons as string
  pw_inbox?: string;  // inbox code
  inbox_params?: string;  // inbox params json INotificationPayloadInboxParams
  [key: string]: any;  // root params
}

interface IChromeNotificationPayload {
  data: INotificationPayload;
  from: string;  // ??
}

interface INotificationButton {
  title: string;
  action?: string;
  url?: string;
}

interface INotificationOptionsPayload {
  body: string;
  title: string;
  icon: string;
  image: string;
  buttons: Array<INotificationButton>;
  customData: {[key: string]: any};
  campaignCode: string;
  duration: number;
  openUrl: string;
  [key: string]: any;
}

interface IShowNotificationOptionsData {
  code: string;  // message code
  buttons: Array<INotificationButton>;
  duration: number;
  image: string;
  campaignCode: string;
  inboxId: string;
}

interface IShowNotificationOptions {
  body: string;
  icon: string;
  requireInteraction: boolean;  // show close button
  tag: string;
  data: IShowNotificationOptionsData;
  actions: Array<INotificationButton>;
  image: string;
  badge?: string;  // android chrome badge icon,
  [key: string]: any;
}
