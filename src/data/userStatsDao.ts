import { getDb } from './db';
import { UserStats } from '../types/gamification';

const DEFAULT_STATS_ID = 'stats_1';
const LAST_COMPLETION_KEY = 'last_completion_date';

function toDateOnlyString(date: Date) {
  return date.toISOString().split('T')[0];
}

async function getMetaValue(key: string): Promise<string | null> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT value FROM meta WHERE key = ?`, [key]);
  if (results.rows.length === 0) return null;
  return results.rows.item(0).value ?? null;
}

async function setMetaValue(key: string, value: string) {
  const db = await getDb();
  await db.executeSql(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, [key, value]);
}

export async function getUserStats(): Promise<UserStats> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT * FROM user_stats WHERE id = ?`, [DEFAULT_STATS_ID]);
  if (results.rows.length > 0) {
    const row = results.rows.item(0);
    return {
      id: row.id,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      xpTotal: row.xp_total,
      level: row.level,
      updatedAt: row.updated_at,
    };
  }
  const now = new Date().toISOString();
  await db.executeSql(
    `INSERT INTO user_stats (id, current_streak, longest_streak, xp_total, level, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [DEFAULT_STATS_ID, 0, 0, 0, 1, now]
  );
  return {
    id: DEFAULT_STATS_ID,
    currentStreak: 0,
    longestStreak: 0,
    xpTotal: 0,
    level: 1,
    updatedAt: now,
  };
}

export async function recordTaskCompletion(): Promise<UserStats> {
  const db = await getDb();
  const stats = await getUserStats();
  const today = new Date();
  const todayStr = toDateOnlyString(today);
  const lastCompletion = await getMetaValue(LAST_COMPLETION_KEY);

  let currentStreak = stats.currentStreak;
  if (lastCompletion === todayStr) {
    // no change
  } else {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = toDateOnlyString(yesterday);
    currentStreak = lastCompletion === yesterdayStr ? currentStreak + 1 : 1;
  }

  const longestStreak = Math.max(stats.longestStreak, currentStreak);
  const xpTotal = stats.xpTotal + 10;
  const level = Math.floor(xpTotal / 100) + 1;
  const updatedAt = new Date().toISOString();

  await db.executeSql(
    `UPDATE user_stats
     SET current_streak = ?, longest_streak = ?, xp_total = ?, level = ?, updated_at = ?
     WHERE id = ?`,
    [currentStreak, longestStreak, xpTotal, level, updatedAt, stats.id]
  );

  await setMetaValue(LAST_COMPLETION_KEY, todayStr);

  return {
    id: stats.id,
    currentStreak,
    longestStreak,
    xpTotal,
    level,
    updatedAt,
  };
}
