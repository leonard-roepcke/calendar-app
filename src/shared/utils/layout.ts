import type { CalendarConfig } from '../../domain/models/calendarConfig';
import type { TimeBlock } from '../../domain/models/timeBlock';
import {
  clampMinutes,
  durationMinutes,
  minutesSinceStartOfDay,
  snapMinutesToInterval,
  startOfDay,
  daysBetween,
  addDays,
  dateFromDayMinutes,
} from './dateTime';

export interface BlockLayout {
  blockId: string;
  top: number;
  height: number;
  left: number;
  width: number;
  dayIndex?: number;
}

export interface TimelineMetrics {
  totalHeight: number;
  minutesPerPixel: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
}

export function getTimelineMetrics(config: CalendarConfig): TimelineMetrics {
  const dayStartMinutes = config.dayStartHour * 60;
  const dayEndMinutes = config.dayEndHour * 60;
  const totalMinutes = dayEndMinutes - dayStartMinutes;
  const totalHeight = (config.dayEndHour - config.dayStartHour) * config.hourHeight;

  return {
    totalHeight,
    minutesPerPixel: totalMinutes / totalHeight,
    dayStartMinutes,
    dayEndMinutes,
  };
}

export function minutesToY(
  minutes: number,
  config: CalendarConfig,
  metrics: TimelineMetrics,
): number {
  return ((minutes - metrics.dayStartMinutes) / metrics.minutesPerPixel);
}

export function yToMinutes(
  y: number,
  config: CalendarConfig,
  metrics: TimelineMetrics,
): number {
  const raw = metrics.dayStartMinutes + y * metrics.minutesPerPixel;
  const snapped = snapMinutesToInterval(raw, config.snapMinutes);
  return clampMinutes(snapped, metrics.dayStartMinutes, metrics.dayEndMinutes);
}

export function layoutTimeBlocks(
  blocks: TimeBlock[],
  config: CalendarConfig,
  contentWidth: number,
  gutter = 12,
): BlockLayout[] {
  const metrics = getTimelineMetrics(config);

  return blocks.map((block) => {
    const startMinutes = minutesSinceStartOfDay(block.startAt);
    const endMinutes = minutesSinceStartOfDay(block.endAt);
    const top = minutesToY(startMinutes, config, metrics);
    const height = Math.max(
      minutesToY(endMinutes, config, metrics) - top,
      config.hourHeight / 4,
    );

    return {
      blockId: block.id,
      top,
      height,
      left: gutter,
      width: contentWidth - gutter * 2,
    };
  });
}

export function layoutTimeBlocksForWeek(
  blocks: TimeBlock[],
  weekStart: Date,
  config: CalendarConfig,
  gridWidth: number,
  columnCount = 7,
  gutter = 2,
): BlockLayout[] {
  const metrics = getTimelineMetrics(config);
  const columnWidth = gridWidth / columnCount;

  const layouts: BlockLayout[] = [];

  for (const block of blocks) {
    const dayIndex = daysBetween(weekStart, block.startAt);
    if (dayIndex < 0 || dayIndex >= columnCount) {
      continue;
    }

    const startMinutes = minutesSinceStartOfDay(block.startAt);
    const endMinutes = minutesSinceStartOfDay(block.endAt);
    const top = minutesToY(startMinutes, config, metrics);
    const height = Math.max(
      minutesToY(endMinutes, config, metrics) - top,
      config.hourHeight / 4,
    );

    layouts.push({
      blockId: block.id,
      top,
      height,
      left: dayIndex * columnWidth + gutter,
      width: columnWidth - gutter * 2,
      dayIndex,
    });
  }

  return layouts;
}

export function computeBlockMove(
  block: TimeBlock,
  weekStart: Date,
  deltaDays: number,
  deltaMinutes: number,
  config: CalendarConfig,
): { startAt: Date; endAt: Date } | null {
  const duration = durationMinutes(block.startAt, block.endAt);
  const currentDayIndex = daysBetween(weekStart, block.startAt);
  const newDayIndex = Math.min(Math.max(currentDayIndex + deltaDays, 0), 6);
  const newStartMinutes = clampMinutes(
    minutesSinceStartOfDay(block.startAt) + deltaMinutes,
    config.dayStartHour * 60,
    config.dayEndHour * 60 - duration,
  );

  const newDay = addDays(startOfDay(block.startAt), newDayIndex - currentDayIndex);
  const startAt = dateFromDayMinutes(newDay, newStartMinutes);
  const endAt = dateFromDayMinutes(newDay, newStartMinutes + duration);

  if (validateTimeRange(startAt, endAt)) {
    return null;
  }

  return { startAt, endAt };
}

export function panTranslationToDeltas(
  translationX: number,
  translationY: number,
  columnWidth: number,
  config: CalendarConfig,
): { deltaDays: number; deltaMinutes: number } {
  const deltaDays = columnWidth > 0 ? Math.round(translationX / columnWidth) : 0;
  const metrics = getTimelineMetrics(config);
  const rawMinutes = translationY * metrics.minutesPerPixel;
  const deltaMinutes =
    Math.round(rawMinutes / config.snapMinutes) * config.snapMinutes;
  return { deltaDays, deltaMinutes };
}

export function computeBlockResizeStart(
  block: TimeBlock,
  weekStart: Date,
  deltaDays: number,
  deltaMinutes: number,
  config: CalendarConfig,
): { startAt: Date; endAt: Date } | null {
  const endMinutes = minutesSinceStartOfDay(block.endAt);
  const currentDayIndex = daysBetween(weekStart, block.startAt);
  const newDayIndex = Math.min(Math.max(currentDayIndex + deltaDays, 0), 6);
  const newStartMinutes = clampMinutes(
    minutesSinceStartOfDay(block.startAt) + deltaMinutes,
    config.dayStartHour * 60,
    endMinutes - config.snapMinutes,
  );

  const newDay = addDays(startOfDay(block.startAt), newDayIndex - currentDayIndex);
  const startAt = dateFromDayMinutes(newDay, newStartMinutes);
  const endAt = new Date(block.endAt);

  if (validateTimeRange(startAt, endAt)) {
    return null;
  }

  return { startAt, endAt };
}

export function computeBlockResizeEnd(
  block: TimeBlock,
  weekStart: Date,
  deltaDays: number,
  deltaMinutes: number,
  config: CalendarConfig,
): { startAt: Date; endAt: Date } | null {
  const startMinutes = minutesSinceStartOfDay(block.startAt);
  const currentDayIndex = daysBetween(weekStart, block.endAt);
  const newDayIndex = Math.min(Math.max(currentDayIndex + deltaDays, 0), 6);
  const newEndMinutes = clampMinutes(
    minutesSinceStartOfDay(block.endAt) + deltaMinutes,
    startMinutes + config.snapMinutes,
    config.dayEndHour * 60,
  );

  const newDay = addDays(startOfDay(block.endAt), newDayIndex - currentDayIndex);
  const startAt = new Date(block.startAt);
  const endAt = dateFromDayMinutes(newDay, newEndMinutes);

  if (validateTimeRange(startAt, endAt)) {
    return null;
  }

  return { startAt, endAt };
}

export function normalizeCreationRange(
  startMinutes: number,
  endMinutes: number,
  config: CalendarConfig,
): { startMinutes: number; endMinutes: number } {
  const minStart = config.dayStartHour * 60;
  const maxEnd = config.dayEndHour * 60;
  const start = clampMinutes(
    snapMinutesToInterval(Math.min(startMinutes, endMinutes), config.snapMinutes),
    minStart,
    maxEnd - config.snapMinutes,
  );
  const end = clampMinutes(
    snapMinutesToInterval(Math.max(startMinutes, endMinutes), config.snapMinutes),
    start + config.snapMinutes,
    maxEnd,
  );
  return { startMinutes: start, endMinutes: end };
}

export function validateTimeRange(startAt: Date, endAt: Date): string | null {
  if (endAt <= startAt) {
    return 'Endzeit muss nach der Startzeit liegen.';
  }

  const duration = durationMinutes(startAt, endAt);
  if (duration < 15) {
    return 'Ein Time-Block muss mindestens 15 Minuten dauern.';
  }

  return null;
}
