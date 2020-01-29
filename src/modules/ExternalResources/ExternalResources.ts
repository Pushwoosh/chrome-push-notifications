import * as JSZip from 'jszip';

import { Logger } from '../../logger';
import { UrlParser } from '../UrlParser/UrlParser';

import { EXTERNAL_RESOURCES_REGEXP_SECOND_GROUP } from './ExternalResources.constants';


export class ExternalResources {
  content: string;
  jszip: JSZip;

  constructor(content: string, jszip: JSZip) {
    this.content = content;
    this.jszip = jszip;
  }

  public async getReplacedContent() {
    return this.replaceExternalStyles(this.content)
    .then((content: string) => this.replaceExternalBackgroundUrl(content))
    .then((content: string) => this.replaceExternalImage(content))
    .then((content: string) => this.replaceExternalScript(content))
  }

  private async replaceExternalStyles(content: string, base: string = '/'): Promise<string> {
    // get string patterns for styles
    const pattern = this.getSearchPattern('style');

    // async replace content
    return await this.replacer(content, pattern, async (substring: string): Promise<string> => {
      const path = await this.getReplacedFilePath(substring, pattern, EXTERNAL_RESOURCES_REGEXP_SECOND_GROUP, base); // in regexp url is second group

      // if can't find path - return substring
      if (!path) {
        return substring;
      }

      // get file content
      const content = await this.jszip.file(path).async('text');
      const relative = path.split('/').splice(-1, 1).join('/');

      const result = await this.replaceExternalBackgroundUrl(content, relative);

      // return replaced string
      return '<style type="text/css">' + result.replace('\n', '') + '</style>';
    });
  }

  private async replaceExternalBackgroundUrl(content: string, base: string = '/'): Promise<string> {
    // get string patterns for styles
    const pattern = this.getSearchPattern('backgroundUrl');

    // async replace content
    return await this.replacer(content, pattern, async (substring: string): Promise<string> => {
      const path = await this.getReplacedFilePath(substring, pattern, EXTERNAL_RESOURCES_REGEXP_SECOND_GROUP, base); // in regexp url is second group

      // if can't find path - return substring
      if (!path) {
        return substring;
      }

      // get file content
      const content = await this.jszip.file(path).async('base64');
      const extension = path.split('.').pop();

      // return replaced string
      return `url("data:image/${(extension === 'svg' ? 'svg+xml' : extension)};base64,${content}")`;
    });
  }

  private async replaceExternalImage(content: string, base: string = '/'): Promise<string> {
    // get string patterns for styles
    const pattern = this.getSearchPattern('image');

    // async replace content
    return await this.replacer(content, pattern, async (substring: string): Promise<string> => {
      const path = await this.getReplacedFilePath(substring, pattern, EXTERNAL_RESOURCES_REGEXP_SECOND_GROUP, base); // in regexp url is second group

      // if can't find path - return substring
      if (!path) {
        return substring;
      }

      // get file content
      const content = await this.jszip.file(path).async('base64');
      const extension = path.split('.').pop();

      // return replaced string
      return '<img src="data:image/' + (extension === 'svg' ? 'svg+xml' : extension) +';base64,' + content + '" alt="">';
    });
  }

  private async replaceExternalScript(content: string, base: string = '/'): Promise<string> {
    // get string patterns for script
    const pattern = this.getSearchPattern('script');

    // async replace content
    return await this.replacer(content, pattern, async (substring: string): Promise<string> => {
      const path = await this.getReplacedFilePath(substring, pattern, EXTERNAL_RESOURCES_REGEXP_SECOND_GROUP, base); // in regexp url is second group

      // if can't find path - return substring
      if (!path) {
        return substring;
      }

      // get file content
      const content = await this.jszip.file(path).async('text');

      // return replaced string
      return '<script>' + content + '</script>';
    });
  }

  private getSearchPattern(type: 'style' | 'image' | 'backgroundUrl' | 'script'): string {
    switch (type) {
      case 'style':
        return '<link[^>]*href=(\'|")([^>]*\.(css))(\'|")[^>]*>';
      case 'backgroundUrl':
        return 'url\\s*\\((\'|")?([^)]*\\.(gif|jpg|jpeg|png|svg))(\'|")?\\s*\\)';
      case 'image':
        return '<img[^\\/?>]*src=(\'|")([^>]*\\.(gif|jpg|jpeg|png|svg))(\'|")[^\\/?>]*>';
      case 'script':
        return '<script[^>]*src=(\'|")(.*\\.js)(\'|")[^>]*>(\\n|\\r|\\s)*<\\/script>';
    }
  }

  private async replacer(content: string, pattern: string, callback: (substring: string) => Promise<string>): Promise<string> {
    const arPromises: Promise<string>[] = [];
    const regexp = new RegExp(pattern, 'g');

    content.replace(regexp, (substring: string): string => {
      arPromises.push(callback(substring));

      return substring;
    });

    const replaces = await Promise.all(arPromises);

    return content.replace(regexp, () => {
      const replace = replaces.shift();

      return replace || '';
    });
  }

  private async getReplacedFilePath (substring: string, pattern: string, matchPosition: number, base: string = '/'): Promise<string | void> {
    // create pattern without global modifier
    const regexp = new RegExp(pattern);

    // get regexp matches
    const matches = substring.match(regexp);

    // if can not find matches - return void
    if (!matches || !matches.length) {
      return;
    }

    // find url match by match position
    const match = matches[matchPosition];

    // get Url Parser instance for check url
    const url = new UrlParser(match, base);

    // if link absolute - return void
    if (url.checkIsAbsolutePath()) {
      return;
    }

    // get relative path
    const path = url.getRelativePath();

    // check existing file in archive - if have not file for replace return void
    if (!this.jszip.files[path]) {
      Logger.write('error', 'Not found file: "' + path + '" for replace.');

      return;
    }

    return path;
  }
}
