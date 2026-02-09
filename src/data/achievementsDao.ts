import { getDb } from './db';
import { Achievement } from '../types/gamification';

const DEFAULT_ACHIEVEMENTS = [
  {
    code: 'first_task',
    title: 'First Task',
    description: 'Complete your first task.',
  },
  {
    code: 'five_tasks',
    title: 'Momentum',
    description: 'Complete 5 tasks.',
  },
  {
    code: 'ten_tasks',
    title: 'High Gear',
    description: 'Complete 10 tasks.',
  },
  {
    code: 'streak_3',
    title: '3-Day Streak',
    description: 'Complete tasks 3 days in a row.',
  },
  {
    code: 'streak_7',
    title: '7-Day Streak',
    description: 'Complete tasks 7 days in a row.',
  },
];

export async function ensureDefaultAchievements() {
  const db = await getDb();
  const now = new Date().toISOString();
  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    const id = `ach_${achievement.code}`;
    await db.executeSql(
      `INSERT OR IGNORE INTO achievements (id, code, title, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, achievement.code, achievement.title, achievement.description, now, now]
    );
  }
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT * FROM achievements`);
  const rows = results.rows;
  const achievements: Achievement[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows.item(i);
    achievements.push({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
  return achievements;
}

export async function getUserAchievementIds(): Promise<string[]> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT achievement_id FROM user_achievements`);
  const rows = results.rows;
  const ids: string[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    ids.push(rows.item(i).achievement_id);
  }
  return ids;
}

export async function unlockAchievement(achievementId: string) {
  const db = await getDb();
  const id = `ua_${achievementId}`;
  const now = new Date().toISOString();
  await db.executeSql(
    `INSERT OR IGNORE INTO user_achievements (id, achievement_id, unlocked_at)
     VALUES (?, ?, ?)`,
    [id, achievementId, now]
  );
}
