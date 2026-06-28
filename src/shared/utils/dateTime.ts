const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

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

/** Montag als Wochenstart (de-DE). */
export function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function daysBetween(start: Date, end: Date): number {
  const startMs = startOfDay(start).getTime();
  const endMs = startOfDay(end).getTime();
  return Math.round((endMs - startMs) / MS_PER_DAY);
}

export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const offset = daysBetween(weekStart, date);
  return offset >= 0 && offset < 7;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MS_PER_MINUTE);
}

export function formatWeekRange(weekStart: Date, locale = 'de-DE'): string {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
  const endLabel = weekEnd.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function formatWeekdayShort(date: Date, locale = 'de-DE'): string {
  return date.toLocaleDateString(locale, { weekday: 'short' });
}

export function formatDayNumber(date: Date): string {
  return date.getDate().toString();
}
