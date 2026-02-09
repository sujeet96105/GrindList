import { create } from 'zustand';
import { getSyncCounts } from '../data/syncQueueDao';
import { runSyncOnce } from '../sync/syncWorker';

type SyncState = {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt?: string | null;
  refreshCounts: () => Promise<void>;
  runSyncNow: () => Promise<void>;
};

export const useSyncStore = create<SyncState>((set) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,
  refreshCounts: async () => {
    const counts = await getSyncCounts();
    set({ pendingCount: counts.pendingCount });
  },
  runSyncNow: async () => {
    set({ isSyncing: true });
    try {
      await runSyncOnce();
    } finally {
      const counts = await getSyncCounts();
      set({
        isSyncing: false,
        pendingCount: counts.pendingCount,
        lastSyncAt: new Date().toISOString(),
      });
    }
  },
}));
