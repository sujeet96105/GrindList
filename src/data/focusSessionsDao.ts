import { getDb } from './db';
import { FocusSession } from '../types/focus';

export async function insertFocusSession(session: FocusSession) {
  const db = await getDb();
  await db.executeSql(
    `INSERT INTO focus_sessions
    (id, task_id, duration_minutes, started_at, ended_at, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.taskId ?? null,
      session.durationMinutes,
      session.startedAt,
      session.endedAt ?? null,
      session.status,
      session.createdAt,
      session.updatedAt,
    ]
  );
}

export async function getRecentFocusSessions(limit = 5): Promise<FocusSession[]> {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT ?`,
    [limit]
  );
  const rows = results.rows;
  const sessions: FocusSession[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows.item(i);
    sessions.push({
      id: row.id,
      taskId: row.task_id,
      durationMinutes: row.duration_minutes,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
  return sessions;
}
