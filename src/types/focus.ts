export type FocusSessionStatus = 'completed' | 'abandoned';

export type FocusSession = {
  id: string;
  taskId?: string | null;
  durationMinutes: number;
  startedAt: string;
  endedAt?: string | null;
  status: FocusSessionStatus;
  createdAt: string;
  updatedAt: string;
};
