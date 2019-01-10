import Params from '../data/Params';
import InboxParams from '../data/InboxParams';
import {PlatformChecker} from '../PlatformChecker';


export default class PayloadBuilder {
  params: Params;
  inboxParams: InboxParams;
  platformChecker: PlatformChecker;

  constructor(
    params: Params = new Params(),
    inboxParams: InboxParams = new InboxParams(),
    platformChecker: PlatformChecker = new PlatformChecker(Function('return this')())
  ) {
    this.params = params;
    this.inboxParams = inboxParams;
    this.platformChecker = platformChecker;
  }

  async getInboxMessages(count?: number): Promise<IGetInboxMessagesRequest> {
    const application = await this.params.appCode;
    const hwid = await this.params.hwid;
    const userId = await this.params.userId || hwid;  // set hwid if not userId

    const lastCode = await this.inboxParams.lastRequestCode;
    const lastRequestTime = await this.inboxParams.lastRequestTime;

    // Payload
    return {
      application,
      hwid,
      userId,
      count,
      last_code: lastCode,
      last_request_time: lastRequestTime
    };
  }

  async inboxStatus(inboxOrder: string, status: TInboxMessageStatus): Promise<IInboxStatusRequest> {
    const application = await this.params.appCode;
    const hwid = await this.params.hwid;
    const userId = await this.params.userId || hwid;  // set hwid if not userId

    return {
      application,
      hwid,
      userId,
      inbox_code: inboxOrder,
      status,
      time: (new Date()).getTime(),
      device_type: this.platformChecker.platform
    };
  }
}
