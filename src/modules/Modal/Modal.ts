import { CommandBus, TCommands } from '../CommandBus/CommandBus';
import { EventBus, TEvents } from '../EventBus/EventBus';

import {
  MODAL_CLOSE_BUTTON_NAMESPACE,
  MODAL_DEFAILT_OPTIONS,
  MODAL_IFRAME_NAMESPACE,
  MODAL_INNER_NAMESPACE,
  MODAL_LOADER_NAMESPACE,
  MODAL_WRAPPER_NAMESPACE
} from './Modal.constants';

import { IModalOptions } from './Modal.types';

export class Modal {
  private readonly wrapper: HTMLElement;
  private readonly inner: HTMLElement;
  private readonly iframe: HTMLElement;
  private readonly option: IModalOptions;

  constructor(options: IModalOptions = {}) {
    let wrapper = document.getElementById(MODAL_WRAPPER_NAMESPACE);
    let inner = document.getElementById(MODAL_INNER_NAMESPACE);
    let loader = document.getElementById(MODAL_LOADER_NAMESPACE);
    let iframe = document.getElementById(MODAL_IFRAME_NAMESPACE);
    let close = document.getElementById(MODAL_CLOSE_BUTTON_NAMESPACE);

    this.option = {
      ...MODAL_DEFAILT_OPTIONS,
      ...options
    };

    if (!wrapper || !inner || !loader || !iframe || !close) {
      // create wrapper
      wrapper = document.createElement('div');
      wrapper.id = MODAL_WRAPPER_NAMESPACE;
      wrapper.className = MODAL_WRAPPER_NAMESPACE;

      // create inner
      inner = document.createElement('div');
      inner.id = MODAL_INNER_NAMESPACE;
      inner.className = MODAL_INNER_NAMESPACE;

      // create loader
      loader = document.createElement('div');
      loader.id = MODAL_LOADER_NAMESPACE;
      loader.className = MODAL_LOADER_NAMESPACE;

      // create close button
      close = document.createElement('button');
      close.id = MODAL_CLOSE_BUTTON_NAMESPACE;
      close.className = MODAL_CLOSE_BUTTON_NAMESPACE;

      // create iframe
      iframe = document.createElement('iframe');
      iframe.id = MODAL_IFRAME_NAMESPACE;
      iframe.className = MODAL_IFRAME_NAMESPACE;

      inner.appendChild(iframe);
      inner.appendChild(close);

      if (this.option.isShowPreloader) {
        inner.appendChild(loader);
      }

      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);

      // add styles for show
      const style = document.createElement('style');

      style.innerHTML = `
        .${MODAL_WRAPPER_NAMESPACE} {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 99999999;
          opacity: 0.999;
          display:none;
        }

        .${MODAL_WRAPPER_NAMESPACE}_state-show {
          display: block;
        }

        .${MODAL_INNER_NAMESPACE} {
          width: 100%;
          height: 100%;
        }

        .${MODAL_INNER_NAMESPACE}_state-loading {
          background-color: ${this.option.backgroundColor};
        }
        
        .${MODAL_CLOSE_BUTTON_NAMESPACE} {
          appearance: none;
          border: none;
          background-color: transparent;
          box-shadow: none;
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          cursor: pointer;
        }
        
        .${MODAL_CLOSE_BUTTON_NAMESPACE}:after {
          content: '';
          position: absolute;
          top: 50%;
          left:50%;
          width: 30px;
          height: 2px;
          background-color: ${this.option.closeButtonColor};
          transform: translateX(-50%) translateY(-50%) rotate(-45deg);
        }
        
        .${MODAL_CLOSE_BUTTON_NAMESPACE}:before {
          content: '';
          position: absolute;
          top: 50%;
          left:50%;
          width: 30px;
          height: 2px;
          background-color: ${this.option.closeButtonColor};
          transform: translateX(-50%) translateY(-50%) rotate(45deg);
        }

        .${MODAL_INNER_NAMESPACE}_state-loading .${MODAL_LOADER_NAMESPACE} {
          display: block;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .${MODAL_LOADER_NAMESPACE} {
          display: none;
        }

        .${MODAL_LOADER_NAMESPACE},
        .${MODAL_LOADER_NAMESPACE}:before,
        .${MODAL_LOADER_NAMESPACE}:after {
          border-radius: 50%;
          width: 2.5em;
          height: 2.5em;
          -webkit-animation-fill-mode: both;
          animation-fill-mode: both;
          -webkit-animation: ${MODAL_LOADER_NAMESPACE} 1.8s infinite ease-in-out;
          animation: ${MODAL_LOADER_NAMESPACE} 1.8s infinite ease-in-out;
        }

        .${MODAL_LOADER_NAMESPACE} {
          color: #ffffff;
          font-size: 10px;
          text-indent: -9999em;
          -webkit-transform: translateZ(0);
          -ms-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-animation-delay: -0.16s;
          animation-delay: -0.16s;
        }

        .${MODAL_LOADER_NAMESPACE}:before,
        .${MODAL_LOADER_NAMESPACE}:after {
          content: '';
          position: absolute;
          top: 0;
        }

        .${MODAL_LOADER_NAMESPACE}:before {
          left: -3.5em;
          -webkit-animation-delay: -0.32s;
          animation-delay: -0.32s;
        }

        .${MODAL_LOADER_NAMESPACE}:after {
          left: 3.5em;
        }

        @-webkit-keyframes ${MODAL_LOADER_NAMESPACE} {
          0%,
          80%,
          100% {
            box-shadow: 0 2.5em 0 -1.3em ${this.option.preloaderColor};
          }
          40% {
            box-shadow: 0 2.5em 0 0 ${this.option.preloaderColor};
          }
        }

        @keyframes ${MODAL_LOADER_NAMESPACE} {
          0%,
          80%,
          100% {
            box-shadow: 0 2.5em 0 -1.3em ${this.option.preloaderColor};
          }
          40% {
            box-shadow: 0 2.5em 0 0 ${this.option.preloaderColor};
          }
        }

        .${MODAL_IFRAME_NAMESPACE} {
          width: 100%;
          height: 100%;
          padding: 0;
          border: none;
          display: none;
        }

        .${MODAL_IFRAME_NAMESPACE}_state-show {
          display: block;
        }
      `;
      document.head.appendChild(style);
    }

    this.wrapper = wrapper;
    this.inner = inner;
    this.iframe = iframe;

    close.addEventListener('click', () => {
      this.hide();
    });

    const commandBus = CommandBus.getInstance();
    const eventBus = EventBus.getInstance();

    commandBus.on(TCommands.CLOSE_IN_APP, () => {
      this.hide();
    });

    commandBus.on(TCommands.POST_MESSAGE_TO_IFRAME, (data) => {
      // @ts-ignore
      this.iframe.contentWindow.postMessage(JSON.stringify(data), '*');
    });

    eventBus.on(TEvents.HIDE_NOTIFICATION_PERMISSION_DIALOG, () => {
      // @ts-ignore
      this.iframe.contentWindow.postMessage(JSON.stringify({ method: 'onHidePermissionDialog' }), '*');
    })
  }

  show() {
    this.wrapper.className = MODAL_WRAPPER_NAMESPACE + ' ' + MODAL_WRAPPER_NAMESPACE + '_state-show';

    document.body.style.overflow = 'hidden';

    return this;
  }

  hide() {
    this.wrapper.className = MODAL_WRAPPER_NAMESPACE;

    document.body.style.overflow = 'auto';

    return this;
  }

  setLoading() {
    this.inner.className = MODAL_INNER_NAMESPACE + ' ' + MODAL_INNER_NAMESPACE + '_state-loading';
    this.iframe.className = MODAL_IFRAME_NAMESPACE;

    return this;
  }

  removeLoading() {
    this.inner.className = MODAL_INNER_NAMESPACE;

    return this;
  }

  async setContent(content: string) {
    // @ts-ignore
    this.iframe.srcdoc = content;

    return new Promise(((resolve, reject) => {
      this.iframe.onload = resolve;
      this.iframe.onerror = reject;
    }));
  }

  showContent() {
    this.inner.className = MODAL_INNER_NAMESPACE;
    this.iframe.className = MODAL_IFRAME_NAMESPACE + ' ' + MODAL_IFRAME_NAMESPACE + '_state-show';

    return this;
  }
}
