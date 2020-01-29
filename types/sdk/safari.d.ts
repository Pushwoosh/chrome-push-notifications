interface IPushServiceSafariRequestPayload {
  application: string;
  hwid: string;
}

interface IPushServiceSafariInfo {
  permission: NotificationPermission;
  deviceToken?: string;
}

interface Window {
  safari: {
    pushNotification: {
      permission(siteId: string): IPushServiceSafariInfo;
      requestPermission(
        url: string,
        id: string,
        payload: IPushServiceSafariRequestPayload,
        cb: (permission: IPushServiceSafariInfo) => void): void
    }
  };
}

declare const safari: typeof window.safari;
