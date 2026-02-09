export type SubtaskStatus = 'active' | 'completed';

export type Subtask = {
  id: string;
  taskId: string;
  title: string;
  status: SubtaskStatus;
  orderIndex: number;
  completionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
