import {
  getPendingSyncItems,
  incrementSyncRetries,
  updateSyncItemPayload,
  updateSyncItemStatus,
} from '../data/syncQueueDao';
import { SyncItem } from '../types/sync';
import { getTaskById } from '../data/tasksDao';
import { getTagById } from '../data/tagsDao';
import { getCategoryById } from '../data/categoriesDao';
import { getReminderById } from '../data/remindersDao';

type WorkerHandle = {
  stop: () => void;
};

let workerHandle: WorkerHandle | null = null;

async function sendToServerStub(item: SyncItem) {
  // Placeholder for backend integration.
  return new Promise<void>((resolve) => setTimeout(resolve, 50));
}

async function getLocalEntity(item: SyncItem) {
  switch (item.entityType) {
    case 'task':
      return getTaskById(item.entityId);
    case 'tag':
      return getTagById(item.entityId);
    case 'category':
      return getCategoryById(item.entityId);
    case 'reminder':
      return getReminderById(item.entityId);
    default:
      return null;
  }
}

function getUpdatedAt(entity: unknown): string | null {
  if (!entity || typeof entity !== 'object') return null;
  const value = (entity as { updatedAt?: string }).updatedAt;
  return typeof value === 'string' ? value : null;
}

function parsePayload(payload: string | null): unknown | null {
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function runSyncOnce() {
  const items = await getPendingSyncItems(20);
  for (const item of items) {
    try {
      await updateSyncItemStatus(item.id, 'processing');
      let sendItem = item;
      if (item.action === 'upsert') {
        const local = await getLocalEntity(item);
        const localUpdatedAt = getUpdatedAt(local);
        const payload = parsePayload(item.payload);
        const payloadUpdatedAt = getUpdatedAt(payload);
        if (local && localUpdatedAt && payloadUpdatedAt && localUpdatedAt > payloadUpdatedAt) {
          await updateSyncItemPayload(item.id, local);
          sendItem = { ...item, payload: JSON.stringify(local) };
        }
      }
      await sendToServerStub(sendItem);
      await updateSyncItemStatus(item.id, 'done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      await incrementSyncRetries(item.id, message);
    }
  }
}

export function startSyncWorker(
  intervalMs = 30000,
  onCycleComplete?: () => void
): WorkerHandle {
  if (workerHandle) return workerHandle;
  const timer = setInterval(() => {
    runSyncOnce()
      .catch((err) => console.warn('Sync worker error', err))
      .finally(() => onCycleComplete?.());
  }, intervalMs);

  workerHandle = {
    stop: () => {
      clearInterval(timer);
      workerHandle = null;
    },
  };
  return workerHandle;
}
