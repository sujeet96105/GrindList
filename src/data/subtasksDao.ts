import { getDb } from './db';
import { Subtask } from '../types/subtask';

export async function getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT * FROM subtasks WHERE task_id = ? AND deleted_at IS NULL ORDER BY order_index ASC`,
    [taskId]
  );
  const rows = results.rows;
  const subtasks: Subtask[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows.item(i);
    subtasks.push({
      id: row.id,
      taskId: row.task_id,
      title: row.title,
      status: row.status,
      orderIndex: row.order_index ?? i,
      completionAt: row.completion_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
  return subtasks;
}

export async function replaceSubtasks(taskId: string, subtasks?: Subtask[]) {
  const db = await getDb();
  await db.executeSql(`DELETE FROM subtasks WHERE task_id = ?`, [taskId]);
  if (!subtasks || subtasks.length === 0) return;
  const values = subtasks.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?)`).join(', ');
  const params = subtasks.flatMap((subtask) => [
    subtask.id,
    taskId,
    subtask.title,
    subtask.status,
    subtask.orderIndex,
    subtask.completionAt ?? null,
    subtask.createdAt,
    subtask.updatedAt,
    subtask.deletedAt ?? null,
  ]);
  await db.executeSql(
    `INSERT OR REPLACE INTO subtasks
    (id, task_id, title, status, order_index, completion_at, created_at, updated_at, deleted_at)
    VALUES ${values}`,
    params
  );
}
