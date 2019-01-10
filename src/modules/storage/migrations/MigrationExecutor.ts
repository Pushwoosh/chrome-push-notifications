import Migrations from './Migrations';


export default class MigrationExecutor {
  db: IDBDatabase;
  migrationsBuilder: Migrations;

  constructor(
    db: IDBDatabase,
    migrationsBuilder: Migrations = new Migrations()
  ) {
    this.db = db;
    this.migrationsBuilder = migrationsBuilder;
  }

  applyMigrations() {
    // apply initial migrations
    this.applyMigrationsPack(this.migrationsBuilder.initial);

    // apply migrations, sorted by date
    this.migrationsBuilder.dateSorted.forEach(migrationsPack => {
      this.applyMigrationsPack(migrationsPack);
    })
  }

  applyMigrationsPack(migrationsPack: Array<TMigrationType>) {
    migrationsPack.forEach(migration => {
      migration(this.db);
    });
  }
}
