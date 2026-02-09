export function parseDateOnly(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function isToday(dateString?: string | null): boolean {
  const date = parseDateOnly(dateString);
  if (!date) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isUpcoming(dateString?: string | null): boolean {
  const date = parseDateOnly(dateString);
  if (!date) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date.getTime() > today.getTime();
}

export function formatDueDate(dateString?: string | null): string | undefined {
  const date = parseDateOnly(dateString);
  if (!date) return undefined;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getNextRecurringDate(
  dueDate?: string | null,
  rule?: 'none' | 'daily' | 'weekly' | 'monthly',
  interval = 1
): string | null {
  if (!rule || rule === 'none') return null;
  const base = parseDateOnly(dueDate) ?? new Date();
  let next: Date;
  if (rule === 'daily') {
    next = addDays(base, interval);
  } else if (rule === 'weekly') {
    next = addDays(base, 7 * interval);
  } else {
    next = addMonths(base, interval);
  }
  return next.toISOString().split('T')[0];
}
