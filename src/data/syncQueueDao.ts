import { getDb } from './db';
import { SyncAction, SyncEntity, SyncItem, SyncStatus } from '../types/sync';

function toSyncItem(row: any): SyncItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    payload: row.payload,
    status: row.status,
    retries: row.retries,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function enqueueSyncItem(
  entityType: SyncEntity,
  entityId: string,
  action: SyncAction,
  payload: unknown
) {
  const db = await getDb();
  const now = new Date().toISOString();
  const id = `sync_${Math.random().toString(36).slice(2, 10)}`;
  await db.executeSql(
    `INSERT INTO sync_queue
    (id, entity_type, entity_id, action, payload, status, retries, last_error, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entityType,
      entityId,
      action,
      payload ? JSON.stringify(payload) : null,
      'pending',
      0,
      null,
      now,
      now,
    ]
  );
  return id;
}

export async function getPendingSyncItems(limit = 20): Promise<SyncItem[]> {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT * FROM sync_queue WHERE status IN ('pending','failed') ORDER BY created_at ASC LIMIT ?`,
    [limit]
  );
  const rows = results.rows;
  const items: SyncItem[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    items.push(toSyncItem(rows.item(i)));
  }
  return items;
}

export async function getSyncCounts() {
  const db = await getDb();
  const [results] = await db.executeSql(
    `SELECT
      SUM(CASE WHEN status IN ('pending','failed') THEN 1 ELSE 0 END) AS pendingCount,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processingCount,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS doneCount
    FROM sync_queue`
  );
  if (results.rows.length === 0) {
    return { pendingCount: 0, processingCount: 0, doneCount: 0 };
  }
  const row = results.rows.item(0);
  return {
    pendingCount: row.pendingCount ?? 0,
    processingCount: row.processingCount ?? 0,
    doneCount: row.doneCount ?? 0,
  };
}

export async function updateSyncItemStatus(
  id: string,
  status: SyncStatus,
  lastError?: string | null
) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.executeSql(
    `UPDATE sync_queue SET status = ?, last_error = ?, updated_at = ? WHERE id = ?`,
    [status, lastError ?? null, now, id]
  );
}

export async function updateSyncItemPayload(id: string, payload: unknown) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.executeSql(
    `UPDATE sync_queue SET payload = ?, updated_at = ? WHERE id = ?`,
    [payload ? JSON.stringify(payload) : null, now, id]
  );
}

export async function incrementSyncRetries(id: string, lastError?: string | null) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.executeSql(
    `UPDATE sync_queue SET retries = retries + 1, status = 'failed', last_error = ?, updated_at = ? WHERE id = ?`,
    [lastError ?? null, now, id]
  );
}
