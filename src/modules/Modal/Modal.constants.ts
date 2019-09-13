import { IModalOptions } from './Modal.types';

export const MODAL_WRAPPER_NAMESPACE = 'pushwoosh-in-app-modal-wrapper';
export const MODAL_INNER_NAMESPACE = 'pushwoosh-in-app-modal-inner';
export const MODAL_LOADER_NAMESPACE = 'pushwoosh-in-app-modal-loader';
export const MODAL_CLOSE_BUTTON_NAMESPACE = 'pushwoosh-in-app-modal-close-button';
export const MODAL_IFRAME_NAMESPACE = 'pushwoosh-in-app-modal-iframe';

export const MODAL_DEFAILT_OPTIONS: IModalOptions = {
  backgroundColor: 'rgba(0, 0, 0, .8)',
  closeButtonColor: 'rgba(255, 255, 255, .8)',
  closeButtonHoverColor: 'rgba(255, 255, 1)',
  isShowPreloader: true,
  preloaderColor: 'rgba(255, 255, 255, 1)',
};
