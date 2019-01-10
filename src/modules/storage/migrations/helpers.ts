/**
 * Check existed store, before create
 * @param name
 * @param storeCreator
 */
export function storeCreatorDecorator(name: TSdkStoreName, storeCreator: TMigrationType): TMigrationType {
  return function (database: IDBDatabase) {
    if (database.objectStoreNames.contains(name)) {
      return;
    }

    storeCreator(database);
  }
}
