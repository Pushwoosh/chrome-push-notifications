interface IInApp {
  url: string; // using simple GET request to get content from Pushwoosh server
  code: string; // unique identifier of an In-App
  layout: 'fullscreen' | 'centerbox' | 'topbanner' | 'bottombanner'; // layout format - fullscreen, centerbox, topbanner or bottombanner
  updated: number; // unixtimestamp of last In-App modification
  closeButtonType?: '1'; // if set one need render close button
  hash: string; //zip md5sum since PUSH-10304
  required: boolean; //since PUSH-10660: InApp required for render if already download or not
  priority: string //since PUSH-10660: priority of download rich media
}

type TGetInAppsMethod = 'getInApps'; // entrypoint for get InApps

interface IGetInAppsRequest {
  application: string; // application code
  hwid: string; // device's hwid
  v: string; // browser version
  device_type: string; // device_type
  userId: string; // user id if set or hwid
  language: string // device language
}

interface IGetInAppsResponse {
  inApps: IInApp[]; // array of InApp
}
