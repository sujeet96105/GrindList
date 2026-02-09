import { Subtask } from './subtask';

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'active' | 'completed';

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null; // ISO date string
  priority: Priority;
  status: TaskStatus;
  categoryId?: string | null;
  tagIds?: string[];
  subtasks?: Subtask[];
  recurrenceRule?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceInterval?: number | null;
  recurrenceEndDate?: string | null;
  locationReminder?: {
    lat: number;
    lng: number;
    radiusMeters: number;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
