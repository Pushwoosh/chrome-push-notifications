import { SAFARI_SUBSCRIPTION_SEGMENTS_POPUP_WRAPPER_NAMESPACE } from './SafariSubscriptionSegmentsPopup.constants';
import { STYLES } from './SafariSubscriptionSegmentsPopup.styles';

export class SafariSubscriptionsSegmentsPopup {
  dynamicContent: IKeyString;
  availableChannels: ISubscriptionSegment[];
  subscribedChannels?: TSubscriptionSegmentCode[];
  wrapper: HTMLElement;
  content: string;

  constructor(
    dynamicContent: IKeyString,
    availableChannels: ISubscriptionSegment[],
    subscribedChannels?: TSubscriptionSegmentCode[],
  ) {
    this.dynamicContent = dynamicContent;
    this.availableChannels = availableChannels;
    this.subscribedChannels = subscribedChannels;

    this.content = this.getPopupHTML();

    let wrapper = document.getElementById(SAFARI_SUBSCRIPTION_SEGMENTS_POPUP_WRAPPER_NAMESPACE);

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.id = SAFARI_SUBSCRIPTION_SEGMENTS_POPUP_WRAPPER_NAMESPACE;
      wrapper.className = SAFARI_SUBSCRIPTION_SEGMENTS_POPUP_WRAPPER_NAMESPACE;
    }

    this.wrapper = wrapper;

    this.wrapper.insertAdjacentHTML( 'beforeend', this.content );

    document.body.appendChild(this.wrapper);
    document.head.appendChild(STYLES);
  }

  public show(): void {
    this.wrapper.classList.add('show');
  }

  public hide(): void {
    this.wrapper.classList.remove('show');
  }

  private getPopupHTML() {
    const header = this.createHTMLHeader();
    const body = this.createHTMLBody();

    return `<div class="pushwoosh-safari-subscription-segments">
      ${header}
      ${body}
    </div>`;
  }

  private createHTMLBody() {
    const subheader = this.createHTMLSubHeader();
    const channels = this.createHTMLChannels();
    const controls = this.createHTMLControls();

    return `<div class="pushwoosh-safari-subscription-segments__body">
      ${subheader}
      ${channels}
      ${controls}
    </div>`;
  }

  private createHTMLHeader(): string {
    return `<div class="pushwoosh-safari-subscription-segments__header">
      ${this.dynamicContent.headerText}
    </div>`;
  }

  private createHTMLSubHeader(): string {
    return `<div class="pushwoosh-safari-subscription-segments__sub-header">
      ${this.dynamicContent.subHeaderText ? this.dynamicContent.subHeaderText : ''}
    </div>`;
  }

  private createHTMLChannels(): string {
    return `<div class="pushwoosh-safari-subscription-segments__channels">
      ${this.availableChannels.reduce((result, channel): string => {
        const isChecked = !this.subscribedChannels || this.subscribedChannels.indexOf(channel.code) !== -1;
          
        return result + `<div class="pushwoosh-safari-subscription-segments__channel">
          <label>
            <input
              class="pushwoosh-safari-subscription-segments__field" 
              type="checkbox" 
              value="${channel.code}"
              checked="${isChecked}"
            />
            <span class="pushwoosh-safari-subscription-segments__text">
              ${channel.name}
            </span>
          </label>
        </div>`
      }, '')}
    </div>`;
  }

  private createHTMLControls(): string {
    return `<div class="pushwoosh-safari-subscription-segments__controls">
      <button id="pushwoosh-safari-subscription-segments-accept">
        ${this.dynamicContent.controlsButtonText}
      </button>
    </div>`;
  }
}
