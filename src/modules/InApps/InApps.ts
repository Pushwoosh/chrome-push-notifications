import ApiClient from '../api/ApiClient';
import Logger from '../../logger';
import API from '../../API';
import { keyValue } from '../../storage';
import { EventBus } from '../EventBus/EventBus';
import { Modal } from '../Modal/Modal';
import { RichMedia } from '../RichMedia/RichMedia';
import { ExpanderPushManager, ExpanderPushwoosh } from './expanders/expanders';

import { IInAppsOptions } from './InApps.types';


export class InApps {
  private readonly options: IInAppsOptions;
  private readonly eventBus: EventBus;
  private readonly api: ApiClient;
  private readonly store: typeof keyValue;
  private readonly PW: API;
  private delayInApps: string[] = [];
  public isLoadedInAppsList: boolean = false;
  public inApps: IInApp[];
  public modal: Modal;

  constructor(options: IInAppsOptions, PW: API, api = new ApiClient(), store = keyValue) {
    this.options = options;
    this.eventBus = EventBus.getInstance();
    this.api = api;
    this.store = store;
    this.PW = PW;
    this.modal = new Modal(this.options && this.options.modal ? this.options.modal : {});

    this.init()
      .then(() => {
        Logger.write('info', 'InApps module has been initialized');
      })
      .catch((error) => {
        Logger.write('error', 'InApps module initialization has been failed', error);
      });
  }

  private async init(): Promise<void> {
    this.subscribeToReceiveMessageFromIFrame();

    // when we send postEvent in response
    // we can receive in-app code to be show
    this.eventBus.on<'needShowInApp'>('needShowInApp', (options) => {
      // if is not loaded in app list
      // we delay the show
      if (!this.isLoadedInAppsList) {
        this.delayInApps.push(options.code);

        return;
      }

      this.showInApp(options.code);
    });

    const { inApps } = await this.getList();

    if(this.delayInApps.length) {
      this.delayInApps.forEach((code: string) => {
        this.showInApp(code);
      })
    }

    this.isLoadedInAppsList = true;

    this.inApps = inApps;
  }

  private subscribeToReceiveMessageFromIFrame() {
    window.addEventListener('message', (event) => {
      const { data } = event;

      this.onReceiveNewMessageFromIFrame(data);
    });
  }

  private onReceiveNewMessageFromIFrame(message: any) {
    if(message && (message.name === 'InAppPushwoosh' || message.name === 'InAppPushManager')) {
      switch (message.method) {
        case 'askSubscribe':
          this.eventBus.emit('askSubscribe', null);
          break;
        case 'closeInApp':
          this.eventBus.emit('needCloseInApp', null);
          break;
        case 'openNewLink':
          this.eventBus.emit('openNewLink', message.options);
          window.open(message.options.href, '_blank');
          break;
      }
    }
  }

  public async showInApp(code: string) {
    const filteredRichMedia = this.inApps.filter((inApp) => inApp.code === code);

    if (filteredRichMedia.length !== 1) {
      throw new Error('Can\'t find Rich Media');
    }

    this.modal
      .setLoading()
      .show();

    const currentRichMedia = filteredRichMedia[0];
    const inAppContent = await new RichMedia(
      currentRichMedia.url,
      this.PW,
      [ExpanderPushwoosh, ExpanderPushManager]
    ).getContent();

    await this.modal.setContent(inAppContent);

    this.modal
      .removeLoading()
      .showContent();
  }

  public async getList(): Promise<IGetInAppsResponse> {
    const {
      INIT_PARAMS: {
        deviceType,
        tags: {
          Language: language,
          'Device Model': deviceModel,
        }
      },
      'params.applicationCode': applicationCode,
      'params.hwid': hwid,
      'params.userId': userId,
    } = await keyValue.getAll();

    return this.api.getInApps({
      application: applicationCode,
      hwid: hwid,
      device_type: deviceType,
      v: deviceModel,
      language: language,
      userId: userId || hwid,
    });
  }
}
