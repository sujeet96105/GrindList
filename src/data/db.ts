import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DB_NAME = 'grindlist.db';

export async function getDb() {
  return SQLite.openDatabase({ name: DB_NAME, location: 'default' });
}
