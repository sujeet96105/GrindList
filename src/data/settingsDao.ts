import { getDb } from './db';
import { Settings } from '../types/settings';

const SETTINGS_KEYS = {
  notificationsEnabled: 'setting_notifications_enabled',
  privacyMode: 'setting_privacy_mode',
  aiEnabled: 'setting_ai_enabled',
  quietHoursEnabled: 'setting_quiet_hours_enabled',
  quietHoursStart: 'setting_quiet_hours_start',
  quietHoursEnd: 'setting_quiet_hours_end',
} as const;

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  privacyMode: false,
  aiEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

function toBoolean(value?: string | null, fallback = false) {
  if (value === '1') return true;
  if (value === '0') return false;
  return fallback;
}

async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT value FROM meta WHERE key = ?`, [key]);
  if (results.rows.length === 0) return null;
  return results.rows.item(0).value ?? null;
}

async function setSetting(key: string, value: string) {
  const db = await getDb();
  await db.executeSql(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, [key, value]);
}

export async function getSettings(): Promise<Settings> {
  const [
    notificationsEnabled,
    privacyMode,
    aiEnabled,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
  ] = await Promise.all([
    getSetting(SETTINGS_KEYS.notificationsEnabled),
    getSetting(SETTINGS_KEYS.privacyMode),
    getSetting(SETTINGS_KEYS.aiEnabled),
    getSetting(SETTINGS_KEYS.quietHoursEnabled),
    getSetting(SETTINGS_KEYS.quietHoursStart),
    getSetting(SETTINGS_KEYS.quietHoursEnd),
  ]);

  return {
    notificationsEnabled: toBoolean(
      notificationsEnabled,
      DEFAULT_SETTINGS.notificationsEnabled
    ),
    privacyMode: toBoolean(privacyMode, DEFAULT_SETTINGS.privacyMode),
    aiEnabled: toBoolean(aiEnabled, DEFAULT_SETTINGS.aiEnabled),
    quietHoursEnabled: toBoolean(quietHoursEnabled, DEFAULT_SETTINGS.quietHoursEnabled),
    quietHoursStart: quietHoursStart ?? DEFAULT_SETTINGS.quietHoursStart,
    quietHoursEnd: quietHoursEnd ?? DEFAULT_SETTINGS.quietHoursEnd,
  };
}

export async function updateSettings(settings: Settings) {
  await Promise.all([
    setSetting(
      SETTINGS_KEYS.notificationsEnabled,
      settings.notificationsEnabled ? '1' : '0'
    ),
    setSetting(SETTINGS_KEYS.privacyMode, settings.privacyMode ? '1' : '0'),
    setSetting(SETTINGS_KEYS.aiEnabled, settings.aiEnabled ? '1' : '0'),
    setSetting(
      SETTINGS_KEYS.quietHoursEnabled,
      settings.quietHoursEnabled ? '1' : '0'
    ),
    setSetting(SETTINGS_KEYS.quietHoursStart, settings.quietHoursStart),
    setSetting(SETTINGS_KEYS.quietHoursEnd, settings.quietHoursEnd),
  ]);
}

export async function updateSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
) {
  const map: Record<keyof Settings, string> = SETTINGS_KEYS;
  if (typeof value === 'boolean') {
    await setSetting(map[key], value ? '1' : '0');
    return;
  }
  await setSetting(map[key], String(value));
}
