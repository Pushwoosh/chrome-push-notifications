import { getStyles } from './Popup.helpers';


export class Popup {
  private readonly namespace: string;

  private readonly rootElement: HTMLElement;
  private readonly wrapperElement: HTMLElement;
  private readonly innerElement: HTMLElement;
  private readonly bodyElement: HTMLElement;
  private readonly closeElement: HTMLElement;

  constructor(namespace: string) {
    this.namespace = namespace;

    // get root element
    const root = this.getRootElement();

    // if root element not exist -> create popup html
    if (!root) {
      // create popup
      const html = this.createHTML();

      // append popup to body
      document.body.insertAdjacentHTML('beforeend', html);

      // get root element
      this.rootElement = this.getElementWithCheckExist('root');

      // create styles
      const styles = getStyles(this.namespace);

      // append styles to head
      document.head.appendChild(styles);
    }

    // get dom elements
    this.wrapperElement = this.getElementWithCheckExist('wrapper');
    this.innerElement = this.getElementWithCheckExist('inner');
    this.bodyElement = this.getElementWithCheckExist('body');
    this.closeElement = this.getElementWithCheckExist('close');

    // add on click event listeners
    this.addEventListeners();
  }

  public updateContent(html: string): void {
    this.bodyElement.insertAdjacentHTML('beforeend', html);
  }

  public removeContent(): void {
    this.bodyElement.innerHTML = '';
  }

  public show() {
    document.body.style.overflow = 'hidden';
    this.rootElement.classList.add(`pushwoosh-${this.namespace}-popup_show`);
  }

  public hide() {
    document.body.style.overflow = 'auto';
    this.rootElement.classList.remove(`pushwoosh-${this.namespace}-popup_show`);
  }

  private getRootElement(): HTMLElement | null {
    return document.getElementById(`pushwoosh-${this.namespace}-popup-root`);
  }

  private createHTML(): string {
    return `
      <div
        id="pushwoosh-${this.namespace}-popup-root"
        class="pushwoosh-${this.namespace}-popup"
      >
        <div
          id="pushwoosh-${this.namespace}-popup-wrapper"
          class="pushwoosh-${this.namespace}-popup__wrapper"
        >
          <div
            id="pushwoosh-${this.namespace}-popup-inner"
            class="pushwoosh-${this.namespace}-popup__inner"
          >
            <div
              id="pushwoosh-${this.namespace}-popup-body"
              class="pushwoosh-${this.namespace}-popup__body"
            >
            </div>
          </div>
          <button
            id="pushwoosh-${this.namespace}-popup-close"
            class="pushwoosh-${this.namespace}-popup__close"
            type="button"
          >
          </button>
        </div>
      </div>
    `;
  };

  private getElementWithCheckExist(type: string): HTMLElement {
    const element = document.getElementById(`pushwoosh-${this.namespace}-popup-${type}`);

    if (!element) {
      throw new Error(`Can't find element by id "pushwoosh-${this.namespace}-popup-${type}"`);
    }

    return  element;
  }

  private addEventListeners(): void {
    this.closeElement.addEventListener('click', () => {
      this.hide();
    });

    document.addEventListener('click', (event) => {
      const clickInInner = this.innerElement.contains(<HTMLElement>event.target);
      const clickInWrapper = this.wrapperElement.contains(<HTMLElement>event.target);

      if (!clickInInner && clickInWrapper) {
        this.hide();
      }
    });
  }
}
