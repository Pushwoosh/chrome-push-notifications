import { ApiClient } from '../ApiClient/ApiClient';
import { Api } from '../Api/Api';
import {keyValue} from '../../storage';
import {CommandBus, TCommands} from '../CommandBus/CommandBus';
import {EventBus, TEvents} from '../EventBus/EventBus';
import {Connector} from '../Connector/Connector';
import {Modal} from '../Modal/Modal';
import {RichMedia} from '../RichMedia/RichMedia';
import {ExpanderPushManager, ExpanderPushwoosh, ExpanderPushwooshSendMessage} from './expanders/expanders';

import {CHANNELS} from '../../constants';

import {IInAppsOptions} from './InApps.types';


export class InApps {
  private readonly options: IInAppsOptions;
  private commandBus: CommandBus;
  private eventBus: EventBus;
  private connector: Connector;
  private readonly apiClient: ApiClient;
  private readonly store: typeof keyValue;
  private readonly api: Api;
  private delayInApps: string[] = [];
  public isLoadedInAppsList: boolean = false;
  public inApps: IInApp[];
  public modal: Modal;

  constructor(options: IInAppsOptions, api: Api, apiClient = new ApiClient(), store = keyValue) {
    this.options = options;
    this.apiClient = apiClient;
    this.store = store;
    this.api = api;
    this.modal = new Modal(this.options && this.options.modal ? this.options.modal : {});

    this.connector = new Connector();
    this.commandBus = CommandBus.getInstance();
    this.eventBus = EventBus.getInstance();
  }

  public async init(): Promise<void> {
    this.subscribeToReceiveMessageFromIFrame();

    // when we send postEvent in response
    // we can receive in-app code to be show
    this.commandBus.on(TCommands.SHOW_IN_APP, ({ code }) => {
      // if is not loaded in app list
      // we delay the show
      if (!this.isLoadedInAppsList) {
        this.delayInApps.push(code);

        return;
      }

      this.showInApp(code);
    });

    const { inApps } = await this.getList();

    if(this.delayInApps.length) {
      this.delayInApps.forEach((code: string) => {
        this.showInApp(code);
      })
    }

    this.isLoadedInAppsList = true;

    await keyValue.set('inApps', inApps);

    this.inApps = inApps;
  }

  private subscribeToReceiveMessageFromIFrame() {
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data && typeof data === 'object') {
          this.onReceiveNewMessageFromIFrame(data);
        }
      } catch (e) {
        // nothing...
      }
    });
  }

  private onReceiveNewMessageFromIFrame(message: any) {
    switch (message.method) {
      case 'subscribe':
        this.connector.subscribe()
          .then(() => {
            this.commandBus.emit(TCommands.POST_MESSAGE_TO_IFRAME, {
              code: message.code
            })
          });
        break;
      case 'unsubscribe':
        this.connector.unsubscribe()
          .then(() => {
            this.commandBus.emit(TCommands.POST_MESSAGE_TO_IFRAME, {
              code: message.code
            })
          });
        break;
      case 'getTags':
        this.connector.getTags()
          .then((tags) => {
            this.commandBus.emit(TCommands.POST_MESSAGE_TO_IFRAME, {
              code: message.code,
              tags: {
                ...tags,
                PWChannels: ['Sport news']
              },
            })
          });
        break;
      case 'setTags':
        this.connector.setTags(message.options.tags)
          .then(() => {
            this.commandBus.emit(TCommands.POST_MESSAGE_TO_IFRAME, {
              code: message.code
            })
          });
        break;
      case 'getChannels':
        keyValue.get('CHANNELS')
          .then((channels: unknown[]) => {
            this.commandBus.emit(TCommands.POST_MESSAGE_TO_IFRAME, {
              code: message.code,
              channels
            });
          });

        break;
      case 'checkSubscription':
        this.connector.checkIsSubscribed()
          .then((state) => {
            this.commandBus.emit(TCommands.POST_MESSAGE_TO_IFRAME, {
              code: message.code,
              state,
            })
          });
        break;
      case 'checkManualUnsubscribed':
        this.connector.checkIsManualUnsubscribed()
          .then((state) => {
            this.commandBus.emit(TCommands.POST_MESSAGE_TO_IFRAME, {
              code: message.code,
              state,
            })
          });
        break;
      case 'openLink':
        window.open(message.options.href, '_blank');
        break;
      case 'closeInApp':
        this.commandBus.emit(TCommands.CLOSE_IN_APP);
        break;
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
      this.api,
      [ExpanderPushwooshSendMessage, ExpanderPushwoosh, ExpanderPushManager]
    ).getContent();

    await this.modal.setContent(inAppContent);

    this.modal
      .removeLoading()
      .showContent();
  }

  public async getList(): Promise<IGetInAppsResponse> {
    return this.api.getInApps();
  }
}
