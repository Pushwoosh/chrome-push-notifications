import Logger, {logAndRejectError} from '../../logger';
import {keyValue} from '../../storage';
import {KEY_API_BASE_URL} from '../../constants';
import Params from '../data/Params';


export default function doApiCall<M, Req, Res>(methodName: M, request: Req): Promise<Res> {
  return new Promise(async (resolve, reject) => {
    const params = new Params();
    const pushwooshUrl = await params.apiUrl;

    try {
      const url = `${pushwooshUrl}${methodName}`;

      fetch(url, {
        method: 'post',
        headers: {'Content-Type': 'text/plain;charset=UTF-8'},
        body: JSON.stringify({request})
      }).then((response) => {
        if (!response.ok) {
          logAndRejectError(response.statusText || 'response not ok', reject);
          return;
        }

        response.json().then(async (responseJson: any) => {
          if (responseJson.status_code != 200) {
            logAndRejectError(`Error occurred during the ${methodName} call to Pushwoosh: ${responseJson.status_message}`, reject);
            return;
          }

          // Set base url
          const {base_url = null} = responseJson;
          if (base_url) {
            keyValue.set(KEY_API_BASE_URL, base_url);
            await params.setApiUrl(base_url);
          }

          Logger.write('apirequest', `${methodName} call with arguments: ${JSON.stringify(request)} to Pushwoosh has been successful. Result: ${JSON.stringify(responseJson.response)}`, 'createDoApiFetch');
          resolve(responseJson.response);
        });
      });
    }
    catch (e) {
      logAndRejectError(`Exception while ${methodName} the device: ${e}`, reject);
    }
  });
}
