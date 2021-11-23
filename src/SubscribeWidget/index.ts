import Pushwoosh from '../Pushwoosh';

import {
  PERMISSION_GRANTED,
  PERMISSION_DENIED,
  PERMISSION_PROMPT,

  EVENT_SHOW_SUBSCRIBE_BUTTON,
  EVENT_CLICK_SUBSCRIBE_BUTTON,

  KEY_SHOW_SUBSCRIBE_WIDGET,
  KEY_CLICK_SUBSCRIBE_WIDGET,
  MANUAL_UNSUBSCRIBE,
  SUBSCRIPTION_SEGMENT_EVENT
} from '../constants';

import platformChecker from '../modules/PlatformChecker';

import {
  SUBSCRIBE_WIDGET_DEFAULT_CONFIG,
  WIDGET_CONTAINER_ID
} from './constants';
import Positioning from './positioning';
import bellSVG from './bell';

import { keyValue } from '../storage';


class SubscribeWidget {
  widget: HTMLElement;
  tooltip: HTMLElement;
  popover: HTMLElement;
  style: HTMLElement;
  pw: Pushwoosh;
  config: TBellConfig;
  isEnableChannels?: boolean;

  constructor(pw: Pushwoosh) {
    // Set Pushwoosh object
    this.pw = pw;
    if (!platformChecker.isAvailableNotifications) {
      console.warn('Browser does not support push notifications');
      return;
    }

    // Bindings
    this.clickBell = this.clickBell.bind(this);
    this.onSubscribeEvent = this.onSubscribeEvent.bind(this);
    this.onUnsubscribeEvent = this.onUnsubscribeEvent.bind(this);
    this.onPermissionDeniedEvent = this.onPermissionDeniedEvent.bind(this);
    this.clickOutOfPopover = this.clickOutOfPopover.bind(this);
    this.onClickBellIfEnableChannels = this.onClickBellIfEnableChannels.bind(this);

    // Config
    const tooltipText = Object.assign(SUBSCRIBE_WIDGET_DEFAULT_CONFIG.tooltipText, pw.subscribeWidgetConfig.tooltipText);
    this.config = Object.assign({}, SUBSCRIBE_WIDGET_DEFAULT_CONFIG, pw.subscribeWidgetConfig);
    this.config.tooltipText = tooltipText;

    const arrActions = [];

    // if enabled channels
    const isEnableChannels = pw.isEnableChannels();

    // Render if not subscribed
    const isSubscribed = pw.isSubscribed();

    arrActions.push(isEnableChannels);
    arrActions.push(isSubscribed);

    Promise.all(arrActions)
      .then(([isEnableChannels, isSubscribed]) => {
        if (isEnableChannels) {
          this.isEnableChannels = true;
        }

        if (!isSubscribed || isEnableChannels) {
          this.render();
        }
      });
  }

  /**
   * Apply styles to element
   * @param styles
   * @param {HTMLElement} element
   */
  private addStylesToElement(styles: TCSSStylesObject, element: HTMLElement) {
    Object.keys(styles).forEach((st: TStyleKeys) => {
      element.style[st] = styles[st];
    });
  }

  /**
   * Create container element
   * @returns {HTMLElement}
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = WIDGET_CONTAINER_ID;
    container.className = 'pushwoosh-subscribe-widget';
    const position = Positioning.getBellPosition(this.config.position, this.config.indent);
    const styles = Object.assign({
      zIndex: this.config.zIndex,
    }, position);
    this.addStylesToElement(styles, container);
    return container;
  }

  /**
   * Create styles element
   * @returns {HTMLElement}
   */
  private createStyle(): HTMLElement {
    const styles = require('./assets/css/main.css');
    const styleNode = document.createElement('style');
    styleNode.innerHTML = styles;
    return styleNode;
  }

  /**
   * Create cell button element
   * @returns {HTMLElement}
   */
  private createBell(): HTMLElement {
    const { config } = this;
    let bell;
    if (config.buttonImage) {
      bell = document.createElement('img') as HTMLImageElement;
      bell.src = config.buttonImage;
    }
    else {
      bell = document.createElement('div');
      this.addStylesToElement({
        backgroundColor: config.bgColor,
        boxShadow: config.shadow,
        lineHeight: config.size,
        border: config.bellButtonBorder,
      }, bell);

      bell.innerHTML = bellSVG(config.bellColor, config.bellStrokeColor);
    }
    this.addStylesToElement({
      width: config.size,
      height: config.size,
    }, bell);
    bell.className = 'pushwoosh-subscribe-widget__bell-button';
    return bell;
  }

  /**
   * Create tooltip element
   * @returns {Promise<HTMLElement>}
   */
  private async createTooltip(): Promise<HTMLElement> {
    const tooltip = document.createElement('div');
    const [position, modification] = Positioning.getTooltipPosition(this.config.position, this.config.size);
    tooltip.className = `pushwoosh-subscribe-widget__tooltip pushwoosh-subscribe-widget__tooltip__${modification}`;
    this.addStylesToElement(position, tooltip);

    tooltip.appendChild(await this.createTooltipContent());
    return tooltip;
  }

  /**
   * Create tooltip content element
   * @returns {Promise<HTMLElement>}
   */
  private async createTooltipContent(): Promise<HTMLElement> {
    const tooltipContent = document.createElement('div');
    tooltipContent.innerText = await this.tooltipTextFactory();
    tooltipContent.className = 'pushwoosh-subscribe-widget__tooltip-content';
    return tooltipContent;
  }

  /**
   * Tooltip text content depending of the permissions
   * @returns {Promise<string>}
   */
  private async tooltipTextFactory() {
    const permission = await this.pw.driver.getPermission();
    const {tooltipText} = this.config;
    const isManuallyUnsubscribed = await keyValue.get(MANUAL_UNSUBSCRIBE);

    switch (permission) {
      case PERMISSION_GRANTED:
        return isManuallyUnsubscribed ? tooltipText.needSubscribe : tooltipText.alreadySubscribed;
      case PERMISSION_PROMPT:
        return tooltipText.needSubscribe;
      case PERMISSION_DENIED:
        return tooltipText.blockSubscribe;
      default:
        return tooltipText.needSubscribe;
    }
  }

  /**
   * Create permission denied popover element
   * @returns {HTMLElement}
   */
  private createPopover(): HTMLElement {
    const popoverContentWrapper = document.createElement('div');
    const popover = document.createElement('div');
    const [position, modification] = Positioning.getPopoverPosition(this.config.position, this.config.size);
    popover.className = `pushwoosh-subscribe-widget__popover pushwoosh-subscribe-widget__popover__${modification}`;
    popoverContentWrapper.className = 'pushwoosh-subscribe-widget__popover-content-wrapper';

    this.style.innerHTML += Positioning.getPopoverArrowPosition(this.config.position, this.config.size);

    const styles = Object.assign({
      maxWidth: `calc(100vw - ${this.config.indent} - ${this.config.indent})`
    }, position);
    this.addStylesToElement(styles, popover);

    popoverContentWrapper.appendChild(this.createPopoverContent());
    popover.appendChild(popoverContentWrapper);
    return popover;
  }

  private getBrowserName()  {
    let browser
    if (platformChecker.isOpera) {
      browser = 'opera';
    } else if (<TPlatformChrome>platformChecker.platform === 11 && navigator.userAgent.match(/Android/i)) {
      browser = 'mobileChrome';
    }
    else if (<TPlatformFirefox>platformChecker.platform === 12) {
      browser = 'firefox';
    }
    else if (<TPlatformSafari>platformChecker.platform === 10) {
      browser = 'safari';
    }
    else if (<TPlatformEdge>platformChecker.platform === 150) {
      browser = 'edge';
    }
    else {
      browser = 'chrome';
    }
    return browser;
  }

  /**
   * Create permission denied popover content element
   * @returns {HTMLElement}
   */
  private createPopoverContent(): HTMLElement {
    const { config } = this;
    const popoverContent = document.createElement('div');
    popoverContent.className = 'pushwoosh-subscribe-widget__popover-content';

    const browser = this.getBrowserName();

    const userImageSrc = config.contentImages && config.contentImages[browser];
    if (userImageSrc) {
      const image = document.createElement('img') as HTMLImageElement;
      image.src = userImageSrc;
      popoverContent.appendChild(image);
    } else {
      const standardImagesMap: Record<string, string> = {
        opera: 'opera',
        mobileChrome: 'mobile_chrome',
        firefox: 'FF',
        safari: 'safari',
      };
      const standardImage = standardImagesMap[browser] || 'chrome';
      [{
        src: this.getImageSrc(standardImage),
        width: 500,
        height: 130,
      }, {
        src: this.getImageSrc(`${standardImage}_unlock`),
        width: 500,
        height: 230,
      }].forEach((imageAttrs) => {
        const image = document.createElement('img');
        Object.assign(image, imageAttrs);
        popoverContent.appendChild(image)
      })
    }

    return popoverContent;
  }

  /**
   * Return source of help images depending of the browser
   * @returns {string}
   */
  getImageSrc(img: string): string {
    return `https://cdn.pushwoosh.com/webpush/img/${img}.jpg`;
  }

  private async render() {
    this.widget = this.createContainer();
    this.style = this.createStyle();
    const bell = this.createBell();
    this.tooltip = await this.createTooltip();
    this.popover = await this.createPopover();

    this.widget.appendChild(this.style);
    this.widget.appendChild(bell);
    this.widget.appendChild(this.tooltip);
    this.widget.appendChild(this.popover);

    document.body.appendChild(this.widget);

    this.pw.push(['onSubscribe', this.onSubscribeEvent]);
    this.pw.push(['onUnsubscribe', this.onUnsubscribeEvent]);
    this.pw.push(['onPermissionDenied', this.onPermissionDeniedEvent]);

    // Events
    if (this.isEnableChannels) {
      this.widget.addEventListener('click', this.onClickBellIfEnableChannels);

      return;
    }

    this.addEventListenersIfDisabledChannels();
  }

  onClickBellIfEnableChannels() {
    this.pw.push((api) => {
      // if permission default
      // show subscription segment widget
      if (this.pw.driver.checkIsPermissionDefault()) {
        this.pw.subscriptionSegmentWidget.init();

        return;
      }

      // else need show subscription segment in-app for work width subscription segments
      api.postEvent(SUBSCRIPTION_SEGMENT_EVENT, {});
    });
  }

  async addEventListenersIfDisabledChannels() {
    this.widget.addEventListener('click', this.clickBell);
    window.addEventListener('click', this.clickOutOfPopover);
    await this.triggerPwEvent(EVENT_SHOW_SUBSCRIBE_BUTTON, KEY_SHOW_SUBSCRIBE_WIDGET);
  }

  /**
   * Toggle visibility of popover
   */
  toggleHelpPopover() {
    this.popover.classList.toggle('pushwoosh-subscribe-widget__popover__visible');
  }

  /**
   * Click bell button event callback
   * @returns {Promise<void>}
   */
  private async clickBell() {
    const permission = this.pw.driver.getPermission();

    switch (permission) {
      case PERMISSION_GRANTED:
        await this.pw.subscribe();

        break;
      case PERMISSION_PROMPT:
        await this.pw.subscribe();

        break;
      case PERMISSION_DENIED:
        this.toggleHelpPopover();

        break;
      default:
        console.warn('Unknown browser notification permission')
    }

    await this.triggerPwEvent(EVENT_CLICK_SUBSCRIBE_BUTTON, KEY_CLICK_SUBSCRIBE_WIDGET);
  }

  /**
   * On subscribe event callback
   * @returns {Promise<void>}
   */
  private async onSubscribeEvent() {
    const isEnableChannels = this.pw.isEnableChannels();
    const tooltipContent = this.tooltip.querySelector('div');

    if (tooltipContent === null) {
      return;
    }

    tooltipContent.innerText = this.config.tooltipText.successSubscribe;
    this.tooltip.classList.add('pushwoosh-subscribe-widget__tooltip__visible');

    setTimeout(async () => {
      this.tooltip.classList.remove('pushwoosh-subscribe-widget__tooltip__visible');
      tooltipContent.innerText = await this.tooltipTextFactory();

      // if not enabled subscription segmentation need hide bell
      if (!isEnableChannels) {
        this.widget.classList.add('pushwoosh-subscribe-widget__subscribed');
      }
    }, 2000);
  }

  /**
   * On permission denied event
   * @returns {Promise<void>}
   */
  private async onPermissionDeniedEvent() {
    const isEnableChannels = await this.pw.isEnableChannels();

    // if enabled channels -> show image for unblock permission
    if (isEnableChannels) {
      this.widget.removeEventListener('click', this.onClickBellIfEnableChannels);

      this.addEventListenersIfDisabledChannels();
    }

    const tooltipContent = this.tooltip.querySelector('div');
    if (tooltipContent === null) return;
    tooltipContent.innerText = await this.tooltipTextFactory();
  }

  /**
   * Out of popover click event
   * @param {MessageEvent} ev
   */
  clickOutOfPopover(ev: MessageEvent) {
    const closeRule = this.popover.classList.contains('pushwoosh-subscribe-widget__popover__visible') &&
      !(ev.target as any).classList.contains('pushwoosh-subscribe-widget__popover') &&
      (ev.target as any).closest('.pushwoosh-subscribe-widget__popover') === null &&
      !(ev.target as any).classList.contains('pushwoosh-subscribe-widget__bell-button') &&
      (ev.target as any).closest('.pushwoosh-subscribe-widget__bell-button') === null;

    if (closeRule) this.popover.classList.remove('pushwoosh-subscribe-widget__popover__visible');
  }

  /**
   * Trigger PW API event
   * @param {string} event
   * @param {string} widget
   * @returns {Promise<void>}
   */
  async triggerPwEvent(event: string, widget: string) {
    // no more aggregate statistics

    return;
  }

  private async onUnsubscribeEvent() {
    const tooltipContent = this.tooltip.querySelector('div');

    if (tooltipContent === null) {
      return;
    }

    tooltipContent.innerText = await this.tooltipTextFactory();
  }
}

// Init widget, after init SDK object
document.addEventListener('pushwoosh.initialized', (ev: CustomEvent) => {
  if (ev.detail.pw.subscribeWidgetConfig.enable) {
    new SubscribeWidget(ev.detail.pw);
  }
});

