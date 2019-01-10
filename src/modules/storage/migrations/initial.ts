import {storeCreatorDecorator} from './helpers';
import {
  STORE_NAME_KEY_VALUE,
  STORE_NAME_MAIN_LOG,
  STORE_NAME_MESSAGE_LOG,
  KEY_PATH_BASE_INCREMENT
} from './constants';


/**
 * Create keyValue store migration
 * @param database
 */
function createKeyValueStore(database: IDBDatabase) {
  database.createObjectStore(STORE_NAME_KEY_VALUE, {keyPath: 'key'});
}

/**
 * Create log store migration
 * @param database
 */
function createLogStore(database: IDBDatabase) {
  const logStore = database.createObjectStore(
    STORE_NAME_MAIN_LOG,
    {keyPath: KEY_PATH_BASE_INCREMENT, autoIncrement: true}
  );
  logStore.createIndex('environment', 'environment', {unique: false});
  logStore.createIndex('date', 'date', {unique: false});
  logStore.createIndex('type', 'type', {unique: false});
}

/**
 * Create message log store migration
 * @param database
 */
function createMessageLogStore(database: IDBDatabase) {
  const messagesStore = database.createObjectStore(
    STORE_NAME_MESSAGE_LOG,
    {keyPath: KEY_PATH_BASE_INCREMENT, autoIncrement: true}
  );
  messagesStore.createIndex('date', 'date', {unique: false});
}


export default [
  storeCreatorDecorator(STORE_NAME_KEY_VALUE, createKeyValueStore),
  storeCreatorDecorator(STORE_NAME_MAIN_LOG, createLogStore),
  storeCreatorDecorator(STORE_NAME_MESSAGE_LOG, createMessageLogStore)
];
