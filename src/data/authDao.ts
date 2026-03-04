import { getDb } from './db';

const AUTH_KEYS = {
  token: 'auth_access_token',
  email: 'auth_email',
} as const;

async function getValue(key: string): Promise<string | null> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT value FROM meta WHERE key = ?`, [key]);
  if (results.rows.length === 0) return null;
  return results.rows.item(0).value ?? null;
}

async function setValue(key: string, value: string) {
  const db = await getDb();
  await db.executeSql(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, [
    key,
    value,
  ]);
}

export async function getAuthToken(): Promise<string | null> {
  return getValue(AUTH_KEYS.token);
}

export async function getAuthEmail(): Promise<string | null> {
  return getValue(AUTH_KEYS.email);
}

export async function setAuthSession(token: string, email: string) {
  await Promise.all([
    setValue(AUTH_KEYS.token, token),
    setValue(AUTH_KEYS.email, email),
  ]);
}

export async function clearAuthSession() {
  const db = await getDb();
  await db.executeSql(`DELETE FROM meta WHERE key IN (?, ?)`, [
    AUTH_KEYS.token,
    AUTH_KEYS.email,
  ]);
}
