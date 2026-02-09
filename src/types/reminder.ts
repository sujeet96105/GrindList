export type ReminderStatus = 'scheduled' | 'sent' | 'cancelled';

export type Reminder = {
  id: string;
  taskId: string;
  remindAt: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
