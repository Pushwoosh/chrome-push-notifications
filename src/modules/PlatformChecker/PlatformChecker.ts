export class PlatformChecker {
  private readonly global: Window | ServiceWorkerGlobalScope;

  private readonly _isSafari: boolean;
  private readonly _isOpera: boolean;
  private readonly _isEdge: boolean;
  private readonly _isFirefox: boolean;
  private readonly _isChrome: boolean;

  private readonly _isMacOS: boolean;

  private readonly _isAvailablePromise: boolean;
  private readonly _isAvailableServiceWorker: boolean;
  private readonly _isAvailableNotifications: boolean;

  /**
   * Browser name + version
   * Example: "Chrome 70"
   */
  private readonly _browserVersion: string;
  private readonly _platform: TPlatform;


  constructor(global = window) {
    this.global = global;

    this._isSafari = this.isSafariBrowser();
    this._isOpera = this.isOperaBrowser();
    this._isEdge = this.isEdgeBrowser();
    this._isFirefox = this.isFirefoxBrowser();
    this._isChrome = this.isChromeBrowser();

    this._isMacOS = this.isMacOS();

    this._isAvailablePromise = this.canUsePromise();
    this._isAvailableServiceWorker = this.canUseServiceWorkers();
    this._isAvailableNotifications = this.canReceiveNotifications();

    this._platform = this.getPlatformType();
    this._browserVersion = this.getBrowserVersion();
  }

  // Platform flags

  get isSafari() {
    return this._isSafari;
  }

  get isOpera() {
    return this._isOpera;
  }

  // Platform capabilities
  get isAvailablePromise() {
    return this._isAvailablePromise;
  }

  get isAvailableServiceWorker() {
    return this._isAvailableServiceWorker;
  }

  get isAvailableNotifications() {
    return this._isAvailableNotifications;
  }

  // Platform values

  get platform() {
    return this._platform;
  }

  get browserVersion() {
    return this._browserVersion;
  }

  isSafariBrowser(): boolean {
    return 'safari' in this.global && navigator.userAgent.indexOf('Safari') > -1;
  }

  isOperaBrowser(): boolean {
    return navigator.userAgent.indexOf('Opera') !== -1 || navigator.userAgent.indexOf('OPR') !== -1;
  }

  isEdgeBrowser(): boolean {
    return navigator.userAgent.indexOf('Edge') > -1;
  }

  isFirefoxBrowser(): boolean {
    return navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;
  }

  isChromeBrowser(): boolean {
    return /Chrome/.test(navigator.userAgent)
      && /Google Inc/.test(navigator.vendor)
      && !this._isOpera
      && !this._isEdge;
  }

  isMacOS(): boolean {
    return 'platform' in navigator && navigator.platform.toLowerCase().indexOf('mac') !== -1;
  }

  canUseServiceWorkers(): boolean {
    return !!navigator.serviceWorker && 'PushManager' in this.global && 'Notification' in this.global;
  }

  canUsePromise(): boolean {
    return 'Promise' in this.global;
  }

  /**
   * Check availability ServiceWorker or safari browser on macos
   */
  canReceiveNotifications(): boolean {
    return (this._isSafari && this._isMacOS) || this._isAvailableServiceWorker;
  }

  /**
   * Get Pushwoosh system platform code
   */
  getPlatformType(): TPlatform {
    let platform: TPlatformChrome = 11;

    switch (true) {
      case this._isSafari:
        (<TPlatformSafari>platform) = 10;
        break;

      case this._isOpera || this._isChrome:
        (<TPlatformChrome>platform) = 11;
        break;

      case this._isFirefox:
        (<TPlatformFirefox>platform) = 12;
        break;

      case this._isEdge:
        (<TPlatformEdge>platform) = 15;
        break;
    }

    return platform;
  }

  /**
   * Get browser name + version from userAgent
   */
  getBrowserVersion(): string {
    const {userAgent} = navigator;
    const matchOperaVersion = userAgent.match(/\bOPR\/(\d+)/);
    if (matchOperaVersion !== null) {
      return `Opera ${matchOperaVersion[1]}`;
    }

    const matchEdgeVersion = userAgent.match(/\bEdge\/(\d+)/);
    if (matchEdgeVersion !== null) {
      return `Edge ${matchEdgeVersion[1]}`;
    }

    let match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    const [_, browser = ''] = match;

    if (/trident/i.test(userAgent)) {
      const matchIeVersion = /trident\/([.\d]+)/ig.exec(userAgent) || [];
      const version = matchIeVersion[1] === '7.0'
        ? '11'
        : matchIeVersion[1];
      return `IE ${version || ''}`;
    }

    match = match[2] ? [browser, match[2]] : [navigator.appName, navigator.appVersion, '-?'];
    const version = userAgent.match(/version\/([.\d]+)/i);
    if (version !== null) {
      match.splice(1, 1, version[1]);
    }

    return match.join(' ');
  }
}


export const platformChecker = new PlatformChecker(Function('return this')());

