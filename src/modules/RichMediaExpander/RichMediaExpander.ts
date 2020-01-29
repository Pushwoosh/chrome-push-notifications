export class RichMediaExpander {
  private readonly content: string;
  private readonly expanders: string[];

  constructor(content: string, expanders: string[] = []) {
    this.content = content;
    this.expanders = expanders;
  }

  public uploadExpanders() {
    let merge = this.expanders.join('\r\n');

    return this.content.replace('<head>', '<head>' + merge);
  }
}
