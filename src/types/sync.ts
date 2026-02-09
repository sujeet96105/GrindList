export type SyncEntity = 'task' | 'tag' | 'category' | 'reminder';
export type SyncAction = 'upsert' | 'delete';
export type SyncStatus = 'pending' | 'processing' | 'done' | 'failed';

export type SyncItem = {
  id: string;
  entityType: SyncEntity;
  entityId: string;
  action: SyncAction;
  payload: string | null;
  status: SyncStatus;
  retries: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
};
