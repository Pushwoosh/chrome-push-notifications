import * as JSZip from 'jszip';

import API from '../../API';
import { DynamicContent } from '../DynamicContent/DynamicContent';
import { RichMediaExpander } from '../RichMediaExpander/RichMediaExpander';
import { ExternalResources } from '../ExternalResources/ExternalResources';


export class RichMedia {
  private readonly PW: API;
  private readonly url: string;
  private readonly expanders: string[];

  constructor(url: string, PW: API, expanders: string[]) {
    this.url = url;
    this.PW = PW;
    this.expanders = expanders;
  }

  public async getContent() {
    const { result: { Language: language } } = await this.PW.getTags();
    const jszip = await this.getJSZip();

    if (!jszip.files['index.html']) {
      throw new Error('Can\'t find index.html');
    }

    if (!jszip.files['pushwoosh.json']) {
      throw new Error('Can\'t find pushwoosh.json');
    }

    const values = JSON.parse(await jszip.file('pushwoosh.json').async('text'));

    // get content from index.html file
    let content = await jszip.file('index.html').async('text');

    // update dynamic content
    content = new DynamicContent(content, values, language).getReplacedContent();

    // add pushManager and pushwoosh to content
    content = new RichMediaExpander(content, this.expanders).uploadExpanders();

    // load external resources
    content = await new ExternalResources(content, jszip).getReplacedContent();

    return content;
  };

  private async getJSZip(): Promise<JSZip> {
   return await this.downloadFile()
      .then((response) => this.checkResponse(response))
      .then((blob) =>  this.unZIP(blob));
  }

  private async downloadFile(): Promise<Response> {
    return fetch(this.url, {
      method: 'GET',
    })
  }

  private async checkResponse(response: Response): Promise<Blob> {
    if (response.status !== 200) {
      new Error(response.statusText)
    }

    return response.blob();
  }

  public async unZIP(data: Blob): Promise<JSZip> {
    return JSZip.loadAsync(data);
  }
}
