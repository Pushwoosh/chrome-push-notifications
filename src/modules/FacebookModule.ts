import {
  FACEBOOK_APP_ID,
  FACEBOOK_HWID_KEY
} from '../constants';
import {generateUUID} from '../functions';
import {keyValue} from '../storage';

export default class FacebookModule {
  private readonly config: FacebookModuleConfig;
  private readonly userRef: string = generateUUID();

  constructor(config: FacebookModuleConfig) {
    this.config = config;
    this.init();
  }

  private init() {
    this.renderCheckbox();
    this.initFacebookSDK();
    this.loadFacebookSDK();
  }

  private renderCheckbox() {
    const {
      pageId,
      containerClass
    } = this.config;

    const attributes = [
      {name: 'messenger_app_id', value: FACEBOOK_APP_ID},
      {name: 'class', value: 'fb-messenger-checkbox'},
      {name: 'page_id', value: pageId},
      {name: 'origin', value: `${window.location.protocol}//${window.location.hostname}`},
      {name: 'user_ref', value: this.userRef},
      {name: 'allow_login', value: 'true'},
      {name: 'size', value: 'large'},
      {name: 'skin', value: 'light'},
      {name: 'center_align', value: 'false'}
    ];

    const nodes = document.getElementsByClassName(containerClass);

    for (let index = 0; index < nodes.length; index++) {
      const node = document.createElement('div');

      attributes.forEach((attribute) => {
        node.setAttribute(attribute.name, attribute.value);
      });

      nodes[index].appendChild(node);
    }
  }

  private async getHWID() {
    const hwid = await keyValue.get(FACEBOOK_HWID_KEY);
    if (!hwid) {
      const {
        applicationCode
      } = this.config;
      const newHWID = `${applicationCode}_${generateUUID()}_fb`;
      await keyValue.set(FACEBOOK_HWID_KEY, newHWID);
      return newHWID;
    }
    return hwid;
  }

  private async userConfirm() {
    const {
      pageId,
      applicationCode,
      userId
    } = this.config;
    const FB = (window as any).FB;
    const facebookHwid = await this.getHWID();

    if (FB) {
      FB.AppEvents.logEvent('MessengerCheckboxUserConfirmation', null, {
        app_id: FACEBOOK_APP_ID,
        page_id: pageId,
        ref: JSON.stringify({
          applicationCode,
          userId,
          hwid: facebookHwid
        }),
        user_ref: this.userRef
      });
    }
  }

  private initFacebookSDK() {
    (window as any).fbAsyncInit = () => {
      (window as any).FB.init({
        appId: FACEBOOK_APP_ID,
        xfbml: true,
        version: 'v3.2'
      });

      (window as any).FB.Event.subscribe(
        'messenger_checkbox',
        ({event}: {event: string; state: boolean}) => {
          if (event === 'checkbox') {
            this.userConfirm();
          }
        }
      );
    };
  }

  private loadFacebookSDK() {
    const language = navigator.language || 'en_US';
    (function(d, s, id) {
      let js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        return;
      }
      js = d.createElement(s);
      js.id = id;
      //@ts-ignore
      js.src = 'https://connect.facebook.net/' + language + '/sdk.js';
      if (!fjs) {
        return;
      }
      //@ts-ignore
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');
  }
}
