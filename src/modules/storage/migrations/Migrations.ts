import {default as migrationsInitial} from './initial';
import {default as migrations26_11_2018} from './26-11-2018';
import DateModule from '../../DateModule';


export default class Migrations {
  migrations: TMigrationsObjectType;
  dateModule: DateModule;

  constructor(dateModule: DateModule = new DateModule()) {
    this.migrations = {
      // initial migrations
      initial: migrationsInitial,

      // migrations for 2018-11-26
      '2018/11/26': migrations26_11_2018,
    };
    this.dateModule = dateModule;
  }

  /**
   * Initial migration pack
   */
  get initial(): Array<TMigrationType> {
    return this.migrations.initial;
  }

  /**
   * Return array of migrations packs sorted by date
   */
  get dateSorted(): Array<Array<TMigrationType>> {
    return Object.keys(this.migrations)
      .filter(key => key !== 'initial')  // remove initial migrations
      .sort((a, b) => {  // sort migrations by date YYYY/MM/DD
        const dateA = new DateModule(new Date(a));
        const dateB = new DateModule(new Date(b));
        return dateA.getTimestamp() - dateB.getTimestamp();
      })
      .map(key => this.migrations[key])  // Array of migrations packs, sorted by date
  }
}
