import { apiCall } from './apiCall';
import { TApiClientMethods, IRequestMap, IResponseMap } from './ApiClient.types';

export class ApiClient {
  public async checkDevice(payload: IRequestMap['checkDevice']) {
    return this.makeRequest('checkDevice', payload);
  }

  public async registerDevice(payload: IRequestMap['registerDevice']) {
    return this.makeRequest('registerDevice', payload);
  }

  public async unregisterDevice(payload: IRequestMap['unregisterDevice']) {
    return this.makeRequest('unregisterDevice', payload);
  }

  public async setBadge(payload: IRequestMap['setBadge']) {
    return this.makeRequest('setBadge', payload);
  }

  public async pushStat(payload: IRequestMap['pushStat']) {
    return this.makeRequest('pushStat', payload);
  }

  public async messageDeliveryEvent(payload: IRequestMap['messageDeliveryEvent']) {
    return this.makeRequest('messageDeliveryEvent', payload);
  }

  public async setPurchase(payload: IRequestMap['setPurchase']) {
    return this.makeRequest('setPurchase', payload);
  }

  public async setTags(payload: IRequestMap['setTags']) {
    return this.makeRequest('setTags', payload);
  }

  public async getTags(payload: IRequestMap['getTags']) {
    return this.makeRequest('getTags', payload);
  }

  public async registerUser(payload: IRequestMap['registerUser']) {
    return this.makeRequest('registerUser', payload);
  }

  public async postEvent(payload: IRequestMap['postEvent']) {
    return this.makeRequest('postEvent', payload);
  }

  public async getNearestZone(payload: IRequestMap['getNearestZone']) {
    return this.makeRequest('getNearestZone', payload);
  }

  public async getInboxMessages(payload: IRequestMap['getInboxMessages']) {
    return this.makeRequest('getInboxMessages', payload);
  }

  public async inboxStatus(payload: IRequestMap['inboxStatus']) {
    return this.makeRequest('inboxStatus', payload);
  }

  private async makeRequest<T extends TApiClientMethods>(methodName: T, payload: IRequestMap[T]): Promise<IResponseMap[T]> {
    return apiCall<T, IRequestMap[T], IResponseMap[T]>(methodName, payload);
  }
}


