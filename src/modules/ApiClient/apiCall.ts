import Logger, {logAndRejectError} from '../../logger';
import Params from '../data/Params';
import {
  sendFatalLogToRemoteServer
} from '../../helpers/logger';

export const apiCall = <Method, Request, Response>(methodName: Method, request: Request): Promise<Response> => {
  return new Promise(async (resolve, reject) => {
    const params = new Params();
    const pushwooshUrl = await params.apiUrl;

    try {
      const url = `${pushwooshUrl}${methodName}`;

      fetch(url, {
        method: 'post',
        headers: {'Content-Type': 'text/plain;charset=UTF-8'},
        body: JSON.stringify({ request })
      }).then(async (response) => {
        if (!response.ok) {
          logAndRejectError(response.statusText || 'response not ok', reject);

          await sendFatalLogToRemoteServer({
            message: 'Error in callAPI',
            code: 'FATAL-API-003',
            error: response.statusText,
            applicationCode: params.appCode,
            deviceType: params.deviceType,
            methodName
          });

          return;
        }

        response.json().then(async (responseJson: any) => {
          if (responseJson.status_code != 200) {
            logAndRejectError(`Error occurred during the ${methodName} call to Pushwoosh: ${responseJson.status_message}`, reject);
            return;
          }

          // Set base url
          const { base_url } = responseJson;
          if (base_url) {
            await params.setApiUrl(base_url);
          }

          Logger.write('apirequest', `${methodName} call with arguments: ${JSON.stringify(request)} to Pushwoosh has been successful. Result: ${JSON.stringify(responseJson.response)}`, 'createDoApiFetch');
          resolve(responseJson.response);
        });
      });
    }
    catch (e) {
      await sendFatalLogToRemoteServer({
        message: 'Error in callAPI',
        code: 'FATAL-API-004',
        error: `Crash on fetch. ${e.name}: ${e.message}`,
        applicationCode: params.appCode,
        deviceType: params.deviceType,
        methodName
      });

      logAndRejectError(`Exception while ${methodName} the device: ${e}`, reject);
    }
  });
}
