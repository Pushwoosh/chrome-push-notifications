import { Data } from '../../modules/Data/Data';
import { ApiClient } from '../../modules/ApiClient/ApiClient';
import { Api } from '../../modules/Api/Api';
import { Popup } from '../Popup/Popup';
import { getZip } from '../../helpers/getZip';

import { Logger } from '../../logger';

import { getHTML, getStyles } from './SubscriptionSegmentsWidget.helpers';

import { IMapResponse } from '../../modules/ApiClient/ApiClient.types';


export class SubscriptionPopupWidget {
  private readonly data: Data;
  private readonly apiClient: ApiClient;
  private readonly api: Api;
  private readonly popup: Popup;

  private readonly pw: any;

  constructor(
    data: Data,
    apiClient: ApiClient,
    api: Api,
    popup: Popup,
    pw: any
  ) {
    this.data = data;
    this.apiClient = apiClient;
    this.api = api;
    this.popup = popup;

    this.pw = pw;

    const styles = getStyles();

    document.head.appendChild(styles);
  }

  public async init(): Promise<void> {
    const inAppCode = await this.getInAppCode();

    if (!inAppCode) {
      Logger.error(`Internal error: Can't find in-app code for build subscription segment widget!`);

      return;
    }

    const richMediaUrl = await this.getRichMediaUrlByInAppCode(inAppCode);

    if (!richMediaUrl) {
      Logger.error(`Internal error: Can't find rich media url for build subscription segment widget!`);

      return;
    }

    const content = await this.getDynamicContent(richMediaUrl);
    const segments = await this.getSegments();

    if (!content || !segments) {
      Logger.error(`Internal error: Can't get content or segments for build subscription segment widget!`);

      return;
    }

    const html = getHTML(content, segments);

    this.popup.updateContent(html);

    const denyElement = document.getElementById('pushwoosh-subscription-segments-deny');
    const acceptElement = document.getElementById('pushwoosh-subscription-segments-accept');

    if (denyElement) {
      denyElement.addEventListener('click', () => {
        this.hidePopup();
      })
    }

    if (acceptElement) {
      acceptElement.addEventListener('click', () => {
        const result = [];
        const segments = document.getElementsByClassName('pushwoosh-subscription-segments__field');

        this.hidePopup();

        if (!segments) {
          return;
        }

        for (let index = 0; index < segments.length; index++) {
          const field = (segments[index] as HTMLInputElement);

          if (field.checked) {
            result.push(field.value);
          }
        }

        this.api.setTags({
          'Subscription Segments': result
        });

        this.pw.subscribe();
      })
    }

    this.popup.show();
  }

  public showPopup(): void {
    this.popup.show();
  }

  public hidePopup(): void {
    this.popup.hide();
  }

  private async getRichMediaUrlByInAppCode(code: string): Promise<string | undefined> {
    const inApps = await this.data.getInApps();

    if (!inApps) {
      return;
    }

    const inApp = inApps.find((inApp: { code: string }) => {
      return inApp.code === code;
    });

    if (!inApp) {
      return;
    }

    return inApp.url;
  }

  private async getInAppCode(): Promise<string | undefined> {
    const application = await this.data.getApplicationCode();
    const hwid = await this.data.getHwid();
    const userId = await this.data.getUserId();
    const deviceType = await this.data.getDeviceType();
    const deviceModel = await this.data.getDeviceModel();
    const language = await this.data.getLanguage();
    const version = await this.data.getSdkVersion();

    const timezone = -(new Date).getTimezoneOffset() * 60;

    const date = new Date();
    const time = date.getTime();
    const timestampUTC = Math.floor(time / 1000);
    const timestampCurrent = timestampUTC - (date.getTimezoneOffset() / 60 * 3600);

    const response = await this.apiClient.postEvent({
      application,
      hwid,
      userId: userId || hwid,
      device_type: deviceType,
      device_model: deviceModel,
      language,
      v: version,
      timezone,
      timestampUTC,
      timestampCurrent,
      event: 'Subscription Segments',
      attributes: {},
    });

    return response && response.code;
  }

  private async getSegments(): Promise<IMapResponse['getConfig']['features']['channels']> {
    const features = await this.data.getFeatures();

    return features && features.channels;
  }

  private async getDynamicContent(url: string): Promise<any> {
    const jszip = await getZip(url);
    const data = JSON.parse(await jszip.file('pushwoosh.json').async('text'));

    return data
      && data.localization
      && data.default_language
      && data.localization[data.default_language];
  }
}
