import { Data } from '../Data/Data';
import { Logger } from '../../logger';

import { TMethod, IMapRequest, IMapResponse } from './ApiClient.types';


export class ApiClient {
  private readonly data: Data;
  private readonly logger: typeof Logger;

  constructor(
    data: Data = new Data(),
    logger: typeof Logger = Logger,
  ) {
    this.data = data;
    this.logger = logger;
  }

  public checkDevice(options: IMapRequest['checkDevice']): Promise<IMapResponse['checkDevice']> {
    return this.createRequest('checkDevice', options);
  }

  public getConfig(options: IMapRequest['getConfig']): Promise<IMapResponse['getConfig']> {
    return this.createRequest('getConfig', options);
  }

  public applicationOpen(options: IMapRequest['applicationOpen']): Promise<IMapResponse['applicationOpen']> {
    return this.createRequest('applicationOpen', options);
  }

  public registerDevice(options: IMapRequest['registerDevice']): Promise<IMapResponse['registerDevice']> {
    return this.createRequest('registerDevice', options);
  }

  public unregisterDevice(options: IMapRequest['unregisterDevice']): Promise<IMapResponse['unregisterDevice']> {
    return this.createRequest('unregisterDevice', options);
  }

  public deleteDevice(options: IMapRequest['deleteDevice']): Promise<IMapResponse['deleteDevice']> {
    return this.createRequest('deleteDevice', options);
  }

  public messageDeliveryEvent(options: IMapRequest['messageDeliveryEvent']): Promise<IMapResponse['messageDeliveryEvent']> {
    return this.createRequest('messageDeliveryEvent', options);
  }

  public pushStat(options: IMapRequest['pushStat']): Promise<IMapResponse['pushStat']> {
    return this.createRequest('pushStat', options);
  }

  public setTags(options: IMapRequest['setTags']): Promise<IMapResponse['setTags']> {
    return this.createRequest('setTags', options);
  }

  public getTags(options: IMapRequest['getTags']): Promise<IMapResponse['getTags']> {
    return this.createRequest('getTags', options);
  }

  public registerUser(options: IMapRequest['registerUser']): Promise<IMapResponse['registerUser']> {
    return this.createRequest('registerUser', options);
  }

  public postEvent(options: IMapRequest['postEvent']): Promise<IMapResponse['postEvent']> {
    return this.createRequest('postEvent', options);
  }

  public getInboxMessages(options: IMapRequest['getInboxMessages']): Promise<IMapResponse['getInboxMessages']> {
    return this.createRequest('getInboxMessages', options);
  }

  public inboxStatus(options: IMapRequest['inboxStatus']): Promise<IMapResponse['inboxStatus']> {
    return this.createRequest('inboxStatus', options);
  }

  public pageVisit(options: IMapRequest['pageVisit'], url: string): Promise<IMapResponse['pageVisit']> {
    return this.createRequest('pageVisit', options, url);
  }

  public getInApps(options: IMapRequest['getInApps']): Promise<IMapResponse['getInApps']> {
    return this.createRequest('getInApps', options);
  }


  private async createRequest<T extends TMethod>(methodName: T, request: IMapRequest[T], customUrl?: string): Promise<IMapResponse[T]> {
    const entrypoint = await this.data.getApiEntrypoint();
    const url = customUrl || entrypoint + methodName;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8'
      },
      body: JSON.stringify({
        request
      })
    });

    const result = await this.checkResponse(response);

    // reset api entrypoint if need
    if (result.base_url) {
      await this.data.setApiEntrypoint(result.base_url);
    }

    await this.logger.write(
      'apirequest',
      `${ methodName } call with arguments: ${ JSON.stringify(request) } to Pushwoosh has been successful. Result: ${ JSON.stringify(result.response) }`
    );

    return result.response as IMapResponse[T];
  }

  private async checkResponse(response: Response): Promise<any> {
    if (response.status !== 200) {
      throw new Error(`Error code: ${ response.status }. Error text: ${ response.statusText }`);
    }

    const data = await response.json();

    if (data.status_code !== 200) {
      throw new Error(`Error code: ${ data.status_code }. Error text: ${ data.status_message }`);
    }

    return data;
  }
}
