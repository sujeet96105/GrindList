import { Settings } from '../types/settings';

type QuietResult = {
  adjustedAt: Date;
  wasAdjusted: boolean;
};

function parseClock(value: string) {
  const [h, m] = value.split(':').map(Number);
  return {
    hours: Number.isFinite(h) ? h : 0,
    minutes: Number.isFinite(m) ? m : 0,
  };
}

export function adjustReminderForQuietHours(date: Date, settings: Settings): QuietResult {
  if (!settings.quietHoursEnabled) {
    return { adjustedAt: date, wasAdjusted: false };
  }

  const { hours: startH, minutes: startM } = parseClock(settings.quietHoursStart);
  const { hours: endH, minutes: endM } = parseClock(settings.quietHoursEnd);

  const start = new Date(date);
  start.setHours(startH, startM, 0, 0);
  const end = new Date(date);
  end.setHours(endH, endM, 0, 0);

  const crossesMidnight = start.getTime() >= end.getTime();

  const inQuiet =
    (crossesMidnight && (date >= start || date < end)) ||
    (!crossesMidnight && date >= start && date < end);

  if (!inQuiet) {
    return { adjustedAt: date, wasAdjusted: false };
  }

  if (crossesMidnight && date >= start) {
    end.setDate(end.getDate() + 1);
  }

  return { adjustedAt: end, wasAdjusted: true };
}
