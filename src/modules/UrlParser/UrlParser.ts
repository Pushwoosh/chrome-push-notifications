// @ts-ignore
import * as resolver from 'url-resolve-browser';

import { URL_PARSER_PSEUDO_DOMAIN } from './UrlParser.constants';


export class UrlParser {
  url: string;
  base: string;

  constructor(url: string, base: string = '/') {
    this.url = url;
    this.base = base;
  }

  checkIsAbsolutePath(): boolean {
    const pattern = new RegExp('^(?:[a-z]+:)?//', 'i');

    return pattern.test(this.url);
  }

  getRelativePath(): string {
    // get path with pseudo domain and file base
    const pathWithBase = resolver(URL_PARSER_PSEUDO_DOMAIN, this.base);

    // get path with file url
    const pathWithUrl = resolver(pathWithBase, this.url);

    // get relative path (without pseudo domain)
    return pathWithUrl.replace(URL_PARSER_PSEUDO_DOMAIN, '')
  }
}
