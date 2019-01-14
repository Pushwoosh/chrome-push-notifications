export default class DateModule {
  private _date: Date;

  constructor(date: Date = new Date()) {
    this._date = date;
  }

  set date(date: Date) {
    this._date = date;
  }

  get date() {
    return this._date;
  }

  /**
   * Timestamp in UTC without milliseconds
   */
  getUtcTimestamp() {
    return Math.floor((this.date.getTime() + this.date.getTimezoneOffset() * 60 * 1000) / 1000);
  }

  /**
   * Current date timestamp without milliseconds
   */
  getTimestamp() {
    return Math.round(this.date.getTime() / 1000);
  }

  /**
   * Set date to local timezone
   */
  setLocal() {
    const newDateTimestamp = this._date.getTime() - this.date.getTimezoneOffset() * 60 * 1000;
    this._date = new Date(newDateTimestamp);
  }

  /**
   * Add days to current date
   * @param days
   */
  addDays(days: number) {
    const newDateTimestamp = this._date.getTime() + days * 24 * 60 * 60 * 1000;
    this._date = new Date(newDateTimestamp);
  }

  /**
   * Get inbox fake order
   */
  getInboxFakeOrder(): string {
    return (this._date.getTime() * 100 + 25 * 60 * 60 * 1000 * 100).toString()
  }
}
