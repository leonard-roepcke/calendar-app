const MS_PER_MINUTE = 60_000;

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function minutesSinceStartOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function dateFromDayMinutes(day: Date, minutes: number): Date {
  const result = startOfDay(day);
  result.setMinutes(minutes);
  return result;
}

export function snapMinutesToInterval(minutes: number, interval: number): number {
  return Math.round(minutes / interval) * interval;
}

export function clampMinutes(minutes: number, min: number, max: number): number {
  return Math.min(Math.max(minutes, min), max);
}

export function durationMinutes(startAt: Date, endAt: Date): number {
  return Math.round((endAt.getTime() - startAt.getTime()) / MS_PER_MINUTE);
}

export function formatTime(date: Date, locale = 'de-DE'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDayLabel(date: Date, locale = 'de-DE'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatShortDate(date: Date, locale = 'de-DE'): string {
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
