import * as pwInboxWidget from '@pushwoosh/web-push-inbox-widget';

document.addEventListener('pushwoosh.initialized', (ev: CustomEvent) => {
  if (ev.detail.pw.pwinbox && ev.detail.pw.inboxWidgetConfig.enable) {
    ev.detail.pw.pwinboxWidget = new pwInboxWidget.PWInboxWidget(ev.detail.pw);
  }
});
