import { getDb } from './db';
import { Task } from '../types/task';
import { replaceSubtasks, getSubtasksByTaskId } from './subtasksDao';

function normalizeTagIds(tagIds?: string[]) {
  if (!tagIds || tagIds.length === 0) return [];
  const unique = new Set<string>();
  for (const id of tagIds) {
    if (id) unique.add(id);
  }
  return Array.from(unique);
}

async function replaceTaskTags(taskId: string, tagIds?: string[]) {
  const db = await getDb();
  await db.executeSql(`DELETE FROM task_tags WHERE task_id = ?`, [taskId]);
  const normalized = normalizeTagIds(tagIds);
  if (normalized.length === 0) return;
  const values = normalized.map(() => `(?, ?)`).join(', ');
  const params = normalized.flatMap((tagId) => [taskId, tagId]);
  await db.executeSql(`INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES ${values}`, params);
}

async function attachTagIds(tasks: Task[]): Promise<Task[]> {
  if (tasks.length === 0) return tasks;
  const db = await getDb();
  const placeholders = tasks.map(() => '?').join(', ');
  const taskIds = tasks.map((task) => task.id);
  const [results] = await db.executeSql(
    `SELECT task_id, tag_id FROM task_tags WHERE task_id IN (${placeholders})`,
    taskIds
  );
  const rows = results.rows;
  const tagMap = new Map<string, string[]>();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows.item(i);
    const list = tagMap.get(row.task_id) ?? [];
    list.push(row.tag_id);
    tagMap.set(row.task_id, list);
  }
  return tasks.map((task) => ({
    ...task,
    tagIds: tagMap.get(task.id) ?? [],
  }));
}

export async function insertTask(task: Task) {
  const db = await getDb();
  await db.executeSql(
    `INSERT OR REPLACE INTO tasks
    (id, title, description, due_date, priority, status, category_id, recurrence_rule, recurrence_interval, recurrence_end_date, location_lat, location_lng, location_radius, completion_at, created_at, updated_at, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.title,
      task.description ?? null,
      task.dueDate ?? null,
      task.priority,
      task.status,
      task.categoryId ?? null,
      task.recurrenceRule ?? 'none',
      task.recurrenceInterval ?? null,
      task.recurrenceEndDate ?? null,
      task.locationReminder?.lat ?? null,
      task.locationReminder?.lng ?? null,
      task.locationReminder?.radiusMeters ?? null,
      null,
      task.createdAt,
      task.updatedAt,
      task.deletedAt ?? null,
    ]
  );
  await replaceTaskTags(task.id, task.tagIds);
  if (task.subtasks !== undefined) {
    await replaceSubtasks(task.id, task.subtasks);
  }
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT * FROM tasks WHERE deleted_at IS NULL`);
  const rows = results.rows;
  const tasks: Task[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows.item(i);
    tasks.push({
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.due_date,
      priority: row.priority,
      status: row.status,
      categoryId: row.category_id,
      tagIds: [],
      subtasks: undefined,
      recurrenceRule: row.recurrence_rule ?? 'none',
      recurrenceInterval: row.recurrence_interval,
      recurrenceEndDate: row.recurrence_end_date,
      locationReminder:
        row.location_lat !== null && row.location_lng !== null
          ? {
              lat: row.location_lat,
              lng: row.location_lng,
              radiusMeters: row.location_radius ?? 250,
            }
          : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
  return attachTagIds(tasks);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT * FROM tasks WHERE id = ? LIMIT 1`, [id]);
  if (results.rows.length === 0) return null;
  const row = results.rows.item(0);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    categoryId: row.category_id,
    tagIds: await getTaskTagIds(id),
    subtasks: await getSubtasksByTaskId(id),
    recurrenceRule: row.recurrence_rule ?? 'none',
    recurrenceInterval: row.recurrence_interval,
    recurrenceEndDate: row.recurrence_end_date,
    locationReminder:
      row.location_lat !== null && row.location_lng !== null
        ? {
            lat: row.location_lat,
            lng: row.location_lng,
            radiusMeters: row.location_radius ?? 250,
          }
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function getTaskTagIds(taskId: string): Promise<string[]> {
  const db = await getDb();
  const [results] = await db.executeSql(`SELECT tag_id FROM task_tags WHERE task_id = ?`, [taskId]);
  const rows = results.rows;
  const tagIds: string[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    tagIds.push(rows.item(i).tag_id);
  }
  return tagIds;
}

export async function updateTask(task: Task) {
  const db = await getDb();
  await db.executeSql(
    `UPDATE tasks SET
      title = ?,
      description = ?,
      due_date = ?,
      priority = ?,
      status = ?,
      category_id = ?,
      recurrence_rule = ?,
      recurrence_interval = ?,
      recurrence_end_date = ?,
      location_lat = ?,
      location_lng = ?,
      location_radius = ?,
      updated_at = ?,
      deleted_at = ?
    WHERE id = ?`,
    [
      task.title,
      task.description ?? null,
      task.dueDate ?? null,
      task.priority,
      task.status,
      task.categoryId ?? null,
      task.recurrenceRule ?? 'none',
      task.recurrenceInterval ?? null,
      task.recurrenceEndDate ?? null,
      task.locationReminder?.lat ?? null,
      task.locationReminder?.lng ?? null,
      task.locationReminder?.radiusMeters ?? null,
      task.updatedAt,
      task.deletedAt ?? null,
      task.id,
    ]
  );
  await replaceTaskTags(task.id, task.tagIds);
  if (task.subtasks !== undefined) {
    await replaceSubtasks(task.id, task.subtasks);
  }
}

export async function softDeleteTask(id: string) {
  const db = await getDb();
  const deletedAt = new Date().toISOString();
  await db.executeSql(`UPDATE tasks SET deleted_at = ? WHERE id = ?`, [deletedAt, id]);
}
