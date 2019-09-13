import apiCall from './apiCall';


export default class ApiClient {
  /**
   * Get inbox messages
   * @param payload
   */
  async getInboxMessages(payload: IGetInboxMessagesRequest): Promise<IGetInboxMessagesResponse> {
    const methodName: TGetInboxMessagesMethod = 'getInboxMessages';
    return apiCall<TGetInboxMessagesMethod, IGetInboxMessagesRequest, IGetInboxMessagesResponse>(
      methodName,
      payload
    );
  }

  /**
   * Update inbox message status
   * @param payload
   */
  async inboxStatus(payload: IInboxStatusRequest): Promise<void> {
    const methodName: TInboxStatusMethod = 'inboxStatus';
    return apiCall<TInboxStatusMethod, IInboxStatusRequest, undefined>(
      methodName,
      payload
    );
  }

  /**
   * Get InApp List
   * @param {IGetInAppsRequest} options
   */
  async getInApps(options: IGetInAppsRequest): Promise<IGetInAppsResponse> {
    const methodName: TGetInAppsMethod = 'getInApps';

    return apiCall<TGetInAppsMethod, IGetInAppsRequest, IGetInAppsResponse>(
      methodName,
      options,
    );
  }
}
