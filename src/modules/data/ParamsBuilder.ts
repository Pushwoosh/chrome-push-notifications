export default class ParamsBuilder {
  async buildApiUrl(appCode: Promise<string>) {
    const applicationCode = await appCode;

    return applicationCode && applicationCode.indexOf('.') === -1
      ? `https://${applicationCode}.api.pushwoosh.com/json/1.3/`  // priority for caching
      : 'https://cp.pushwoosh.com/json/1.3/';
  }
}
