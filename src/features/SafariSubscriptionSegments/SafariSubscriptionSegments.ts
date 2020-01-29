import { getZip } from '../../helpers/getZip';
import { Connector } from '../../modules/Connector/Connector';
import { SafariSubscriptionsSegmentsPopup } from '../SafariSubscriptionSegmentsPopup/SafariSubscriptionSegmentsPopup';

import Pushwoosh from '../../Pushwoosh';
import { keyValue } from '../../storage';

export class SafariSubscriptionSegments {
  pushwoosh: Pushwoosh;
  connector: Connector;
  popup?: SafariSubscriptionsSegmentsPopup;

  constructor(pushwoosh: Pushwoosh, connector: Connector = new Connector()) {
    this.pushwoosh = pushwoosh;
    this.connector = connector;
  }

  public async init(): Promise<void> {
    const url = await this.getRichMediaURL();

    if (!url) {
      throw new Error('Can\'t find richmedia url!');
    }

    await this.createPopup(url);

    this.showPopup();

    const $cancel = document.getElementById('pushwoosh-safari-subscription-segments-cancel');
    const $accept = document.getElementById('pushwoosh-safari-subscription-segments-accept');

    if ($cancel) {
      $cancel.addEventListener('click', (): void => {
        this.hidePopup();
      })
    }

    if ($accept) {
      $accept.addEventListener('click', (): void => {
        const channels = this.getSubscribedChannels();

        this.connector.setTags({
          'Subscription Segments': channels
        });

        this.pushwoosh.subscribe();

        this.hidePopup();
      });
    }
  }

  private async createPopup(url: string): Promise<void> {
    const jszip = await getZip(url);
    const data = JSON.parse(await jszip.file('pushwoosh.json').async('text'));

    const dynamicContent = data
      && data.localization
      && data.default_language
      && data.localization[data.default_language];

    const channels = await this.connector.getChannels();

    if (!channels) {
      throw new Error('No available channels!');
    }

    const availableChannels = channels.sort((a, b) => a.position - b.position);

    const tags = await this.connector.getTags();
    const subscribedChannels = Array.isArray(tags['Subscription Segments']) ? tags['Subscription Segments'] : undefined;

    this.popup = new SafariSubscriptionsSegmentsPopup(dynamicContent, availableChannels, subscribedChannels);
  }

  private showPopup(): void {
    this.popup && this.popup.show();
  }

  private hidePopup(): void {
    this.popup && this.popup.hide();
  }

  private getSubscribedChannels(): TSubscriptionSegmentCode[] {
    const result: TSubscriptionSegmentCode[] = [];
    const channels = document.getElementsByClassName('pushwoosh-safari-subscription-segments__field') || [];

    Array.prototype.forEach.call(channels, (element: HTMLInputElement) => {
      if (element.checked) {
        result.push(element.value);
      }
    });

    return result;
  }

  private async getRichMediaURL(): Promise<string | undefined> {
    const code = await this.getRichMediaCodeFromEvent();
    const inApps = await keyValue.get('inApps');

    const richMedia = inApps.find((richMedia: { code: string, url: string }) => richMedia.code === code);

    if (!richMedia) {
      return;
    }

    return richMedia.url;
  }

  private async getRichMediaCodeFromEvent(): Promise<string | undefined> {
    const {
      'params.applicationCode': application,
      'params.hwid': hwid,
      'params.userId': userId,
      'params.apiUrl': apiUrl,
      'KEY_SDK_VERSION': version
    } = await keyValue.getAll();

    const date = new Date();
    const time = date.getTime();
    const timestampUTC = Math.floor(time / 1000);
    const timestampCurrent = timestampUTC - (date.getTimezoneOffset() / 60 * 3600);

    const response = await fetch(apiUrl + 'postEvent', {
      method: 'post',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify({
        request: {
          event: 'Subscription Segments',
          attributes: {},
          application,
          hwid,
          userId: userId || hwid,
          timestampUTC,
          timestampCurrent,
          device_type: 10,
          v: version
        }
      })
    });

    if (response.status !== 200 ) {
      return;
    }

    try {
      const data = await response.json();

      return data && data.response && data.response.code;
    } catch (error) {
      return;
    }
  }
}
