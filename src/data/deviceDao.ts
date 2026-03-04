import { getDb } from './db';

const DEVICE_KEY = 'device_id';

function generateDeviceId() {
  return `dev_${Math.random().toString(36).slice(2, 10)}`;
}

export async function getDeviceId(): Promise<string> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT value FROM meta WHERE key = ?`, [
    DEVICE_KEY,
  ]);
  if (results.rows.length > 0) {
    return results.rows.item(0).value as string;
  }
  const id = generateDeviceId();
  await db.executeSql(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, [
    DEVICE_KEY,
    id,
  ]);
  return id;
}
