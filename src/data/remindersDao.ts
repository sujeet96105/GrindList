import { getDb } from './db';
import { Reminder } from '../types/reminder';

export async function getReminderByTaskId(taskId: string): Promise<Reminder | null> {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT * FROM reminders WHERE task_id = ? AND deleted_at IS NULL ORDER BY remind_at DESC LIMIT 1`,
    [taskId]
  );
  if (results.rows.length === 0) return null;
  const row = results.rows.item(0);
  return {
    id: row.id,
    taskId: row.task_id,
    remindAt: row.remind_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export async function upsertTaskReminder(taskId: string, remindAt: string, id?: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  const reminderId = id ?? `rem_${Math.random().toString(36).slice(2, 10)}`;
  await db.executeSql(
    `INSERT OR REPLACE INTO reminders
    (id, task_id, remind_at, status, created_at, updated_at, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [reminderId, taskId, remindAt, 'scheduled', now, now, null]
  );
  return reminderId;
}

export async function deleteReminderById(id: string) {
  const db = await getDb();
  const deletedAt = new Date().toISOString();
  await db.executeSql(`UPDATE reminders SET deleted_at = ?, status = ? WHERE id = ?`, [
    deletedAt,
    'cancelled',
    id,
  ]);
}

export async function getReminderById(id: string): Promise<Reminder | null> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT * FROM reminders WHERE id = ? LIMIT 1`, [id]);
  if (results.rows.length === 0) return null;
  const row = results.rows.item(0);
  return {
    id: row.id,
    taskId: row.task_id,
    remindAt: row.remind_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
