import {
  DYNAMIC_CONTENT_MODIFIER_CAPITALIZE_FIRST,
  DYNAMIC_CONTENT_MODIFIER_CAPITALIZE_ALL_FIRST,
  DYNAMIC_CONTENT_MODIFIER_UPPERCASE,
  DYNAMIC_CONTENT_MODIFIER_LOWERCASE
} from './DynamicContent.constants'


export class DynamicContent {
  public content: string;
  public values: { [key: string]: any };
  public language: string;

  constructor(content: string, values: { [key: string]: any }, language: string) {
    this.content = content;
    this.values = values;
    this.language = language;
  }

  public getReplacedContent(): string {
    // dynamic content regexp for find {{...|...|...}} or {{...|...|}}
    const regexp = new RegExp('\\{\\{[^\\}\\}]*}}', 'gm');

    return this.content.replace(regexp, (substring) => {
      // remove '{' and '}'
      const pattern = substring
        .replace('}}', '')
        .replace('{{', '');

      return this.getResultingContent(pattern);
    })
  }

  private getResultingContent(pattern: string): string {
    // get values from pattern name|modifier|value
    let [ name, modifier, value = '' ] = pattern.split('|');

    const isNotDefaultLanguage = this.language !== this.values.defaultLanguage;
    const hasReplacedValue = this.values.localization
      && this.values.localization[this.language]
      && this.values.localization[this.language][name];

    if (isNotDefaultLanguage && hasReplacedValue) {
      value = this.values.localization[this.language][name];
    }

    return this.updateStringByModifier(value, modifier);
  }

  private updateStringByModifier(string: string, modifier: string): string {
    switch (modifier.toLowerCase()) {
      case DYNAMIC_CONTENT_MODIFIER_CAPITALIZE_FIRST:
        string = string.toLowerCase();
        string = string.charAt(0).toUpperCase() + string.substring(1);
        return string;

      case DYNAMIC_CONTENT_MODIFIER_CAPITALIZE_ALL_FIRST:
        const arrLetters = string.toLowerCase().split(' ');

        for (let i = 0; i < arrLetters.length; i++) {
          arrLetters[i] = arrLetters[i].charAt(0).toUpperCase() + arrLetters[i].substring(1);
        }

        string = arrLetters.join(' ');

        return string;

      case DYNAMIC_CONTENT_MODIFIER_UPPERCASE:
        return string.toUpperCase();

      case DYNAMIC_CONTENT_MODIFIER_LOWERCASE:
        return string.toLowerCase();

      default:
        return string;
    }
  }
}
