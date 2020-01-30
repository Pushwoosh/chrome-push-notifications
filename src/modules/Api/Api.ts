import { Data } from '../Data/Data';
import { ApiClient } from '../ApiClient/ApiClient';
import { CommandBus } from '../CommandBus/CommandBus';
import { EventBus } from '../EventBus/EventBus';

import EventEmitter from '../../EventEmitter';

import { TCommands } from '../CommandBus/CommandBus.types';
import { TEvents } from '../EventBus/EventBus.types';
import { IMapResponse, IRequest } from '../ApiClient/ApiClient.types';

import * as CONSTANTS from '../../constants';


export class Api {
  private readonly eventEmitter?: EventEmitter;
  private readonly data: Data;
  private readonly apiClient: ApiClient;
  private readonly commandBus: CommandBus;
  private readonly eventBus: EventBus;

  constructor(
    data: Data = new Data(),
    apiClient: ApiClient = new ApiClient(),
    commandBus: CommandBus = CommandBus.getInstance(),
    eventBus: EventBus = EventBus.getInstance(),
    eventEmitter?: EventEmitter,
  ) {
    this.eventEmitter = eventEmitter;
    this.eventBus = eventBus;
    this.data = data;
    this.apiClient = apiClient;
    this.commandBus = commandBus;

    // get tags by connector
    this.commandBus.on(TCommands.GET_TAGS, ({ commandId }) => {
      this.getTags()
        .then(({ result }) => {
          this.eventBus.emit(TEvents.GET_TAGS, { tags: result }, commandId);
        });
    });

    // set tags by connector
    this.commandBus.on(TCommands.SET_TAGS, ({ commandId, tags }) => {
      this.setTags(tags)
        .then(() => {
          this.eventBus.emit(TEvents.SET_TAGS , commandId);
        });
    });
  }

  public async checkDevice(): Promise<IMapResponse['checkDevice']> {
    const params = await this.getRequestParams();

    return await this.apiClient.checkDevice(params);
  }

  public async checkDeviceSubscribeForPushNotifications(useCache: boolean = true): Promise<boolean> {
    // get current subscription status from local storage
    let status = localStorage.getItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS);

    // check need force update
    if (typeof status === 'undefined' || !useCache) {
      await this.checkDevice();

      status = localStorage.getItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS);
    }

    return status === CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED;
  }

  public async getConfig(features: string[]): Promise<IMapResponse['getConfig']> {
    const params = await this.getRequestParams();

    return this.apiClient.getConfig({
      ...params,
      features,
    });
  }

  public async applicationOpen(): Promise<IMapResponse['applicationOpen']> {
    const params = await this.getRequestParams();

    // set do database latest sending time
    await this.data.setLastOpenApplicationTime(Date.now());

    return this.apiClient.applicationOpen(params);
  }

  public async registerDevice(): Promise<IMapResponse['registerDevice']> {
    // check communication disabled
    const isCommunicationDisabled = await this.data.getStatusCommunicationDisabled();

    // if communication disabled -> can't register device
    if (isCommunicationDisabled) {
      throw new Error(`Can't register device: Communication is disabled!`);
    }

    const params = await this.getRequestParams();
    const tokens = await this.data.getTokens();

    // if have not pushToken -> user not get permission for send push notifications
    if (!tokens.pushToken) {
      throw new Error(`Can't register device: pushToken is not exist!`);
    }

    // register device into Pushwoosh
    const response = await this.apiClient.registerDevice({
      ...params,
      ...{
        push_token: tokens.pushToken,
        auth_token: tokens.authToken,
        public_key: tokens.publicKey,
        fcm_push_set: tokens.fcmPushSet,
        fcm_token: tokens.fcmToken,
      },
    });

    // set info to database, that the device IS NOT manual unsubscribed
    await this.data.setStatusManualUnsubscribed(false);

    // set info to local storage, that device is subscribed
    localStorage.setItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS, CONSTANTS.DEVICE_REGISTRATION_STATUS_REGISTERED);

    // emit event
    this.eventEmitter && this.eventEmitter.emit(CONSTANTS.EVENT_ON_REGISTER);

    return response;
  }

  public async unregisterDevice(): Promise<IMapResponse['unregisterDevice']> {
    const params = await this.getRequestParams();
    const response = this.apiClient.unregisterDevice(params);

    // set info to database, that the device IS manual unsubscribed
    await this.data.setStatusManualUnsubscribed(true);

    // set info to local storage, that device is unsubscribed
    localStorage.setItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS, CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED);

    // emit event
    this.eventEmitter && this.eventEmitter.emit(CONSTANTS.EVENT_ON_UNSUBSCRIBE);

    return response;
  }

  public async deleteDevice(): Promise<IMapResponse['deleteDevice']> {
    const params = await this.getRequestParams();

    const response = this.apiClient.deleteDevice(params);

    // set info to database, that the device IS manual unsubscribed
    await this.data.setStatusManualUnsubscribed(true);

    // set info to local storage, that device is unsubscribed
    localStorage.setItem(CONSTANTS.KEY_DEVICE_REGISTRATION_STATUS, CONSTANTS.DEVICE_REGISTRATION_STATUS_UNREGISTERED);

    // emit event
    this.eventEmitter && this.eventEmitter.emit(CONSTANTS.EVENT_ON_UNSUBSCRIBE);

    return response;
  }

  public async messageDeliveryEvent(hash: string): Promise<IMapResponse['messageDeliveryEvent']> {
    const params = await this.getRequestParams();

    return this.apiClient.messageDeliveryEvent({
      ...params,
      hash: hash,
    });
  }

  public async pushStat(hash: string): Promise<IMapResponse['pushStat']> {
    const params = await this.getRequestParams();

    return this.apiClient.pushStat({
      ...params,
      hash: hash,
    });
  }

  public async setTags(tags: { [key: string]: any }): Promise<IMapResponse['setTags']> {
    const params = await this.getRequestParams();

    return this.apiClient.setTags({
      ...params,
      tags,
    });
  }

  public async getTags(): Promise<IMapResponse['getTags']> {
    const params = await this.getRequestParams();

    return this.apiClient.getTags(params);
  }

  public async registerUser(userId: string): Promise<IMapResponse['registerUser']> {
    const params = await this.getRequestParams();

    // set  user id to database
    await this.data.setUserId(userId);

    // set info to database that user id was change
    await this.data.setStatusUserIdWasChanged(true);

    // register user in pushwoosh
    return this.apiClient.registerUser({
      ...params,
      ts_offset: -(new Date).getTimezoneOffset() * 60,
    });
  }

  public async postEvent(event: string, attributes: { [key:string]: any }): Promise<IMapResponse['postEvent']> {
    const params = await this.getRequestParams();

    const date = new Date();
    const time = date.getTime();
    const timestampUTC = Math.floor(time / 1000);
    const timestampCurrent = timestampUTC - (date.getTimezoneOffset() / 60 * 3600);

    // if post event send after notification open:
    // need add message hash to event
    const lastOpenMessage = await this.data.getLastOpenMessage();


    if (lastOpenMessage && lastOpenMessage.expiry > Date.now()) {
      if (attributes['msgHash']) {
        return Promise.reject('attribute msgHash already defined');
      }

      attributes = {
        ...attributes,
        msgHash: lastOpenMessage.messageHash
      };
    }

    // remove last open message
    await this.data.setLastOpenMessage(undefined);


    const response = await this.apiClient.postEvent({
      ...params,
      event,
      timestampUTC,
      timestampCurrent,
      attributes,
    });

    if (response && response.code) {
      this.commandBus.emit(TCommands.SHOW_IN_APP, {
        code: response.code
      });
    }

    return response;
  }

  public async getInboxMessages(count: number = 0): Promise<IMapResponse['getInboxMessages']> {
    const params = await this.getRequestParams();

    const lastCode = await this.data.getInboxLastRequestCode();
    const lastRequestTime = await this.data.getInboxLastRequestTime();

    return this.apiClient.getInboxMessages({
      ...params,
      ...{
        count,
        last_code: lastCode,
        last_request_time: lastRequestTime
      },
    });
  }

  public async inboxStatus(order: string, status: number): Promise<IMapResponse['inboxStatus']> {
    const params = await this.getRequestParams();

    return this.apiClient.inboxStatus({
      ...params,
      ...{
        inbox_code: order,
        status,
        time: (new Date()).getTime(),
      }
    });
  }

  public async triggerEvent(): Promise<void> {
    throw new Error(`Method has been deprecated, because we don't aggregate this statistics.`);
  }

  public async pageVisit(config: { title: string, url_path: string, url: string }): Promise<IMapResponse['pageVisit']> {
    const params = await this.getRequestParams();
    const features = await this.data.getFeatures();

    const url = features && features.page_visit && features.page_visit.entrypoint;

    if (!url) {
      return;
    }

    return this.apiClient.pageVisit({
      ...params,
      ...config,
    }, url);
  }

  public async getInApps(): Promise<IMapResponse['getInApps']> {
    const params = await this.getRequestParams();

    return this.apiClient.getInApps(params);
  }

  public async getParams() {
    const applicationCode = await this.data.getApplicationCode();
    const hwid = await this.data.getHwid();
    const apiParams = await this.data.getTokens();
    const initParams = await this.data.getInitParams();

    return {
      applicationCode,
      hwid,
      ...apiParams,
      ...initParams,
    };
  }

  public get params(): void {
    throw new Error('Property "Pushwoosh.api.params" have been deprecated. Use the async method "Pushwoosh.api.getParams()"');
  }


  private async getRequestParams(): Promise<IRequest> {
    const applicationCode = await this.data.getApplicationCode();
    const hwid = await this.data.getHwid();
    const userId = await this.data.getUserId();
    const deviceType = await this.data.getDeviceType();
    const deviceModel = await this.data.getDeviceModel();
    const language = await this.data.getLanguage();
    const version = await this.data.getSdkVersion();

    const timezone = -(new Date).getTimezoneOffset() * 60;


    return {
      application: applicationCode,
      hwid: hwid,

      userId: userId || hwid,
      device_type: deviceType,
      device_model: deviceModel,
      timezone: timezone,
      language: language,
      v: version,
    };
  };
}
