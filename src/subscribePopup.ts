import {PWSubscribePopup} from '@pushwoosh/web-push-subscribe-popup';

document.addEventListener('pushwoosh.initialized', (ev: CustomEvent) => {
  if (ev.detail.pw.subscribePopupConfig && ev.detail.pw.subscribePopupConfig.enable) {
    const popup = new PWSubscribePopup(ev.detail.pw);
    popup.initPopup().then(() => {
      ev.detail.pw.subscribePopup = popup;
    });
  }
});
