export type AnalyticsEvent =
  | 'task_created'
  | 'task_completed'
  | 'task_deleted'
  | 'task_updated';

export type AnalyticsPayload = Record<string, string | number | boolean | null>;
