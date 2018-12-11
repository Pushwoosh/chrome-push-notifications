type TSafariPermissionObject = {
  permission: 'granted' | 'denied' | 'default';
  deviceToken?: string;
};
interface Window {
  safari: {
    pushNotification: {
      permission(siteId: string): TSafariPermissionObject;
      requestPermission(url: string, id: string, params: {application: string}, cb: (permission: TSafariPermissionObject) => void): void;
    }
  };
}
declare const safari: typeof window.safari;
