import type { TimeBlock } from '../../domain/models/timeBlock';
import { blockColorOptions } from '../../shared/theme/colors';
import {
  addDays,
  dateFromDayMinutes,
  startOfDay,
  startOfWeek,
} from '../../shared/utils/dateTime';

function dayAt(dayOffset: number, hour: number, minute = 0): Date {
  const weekStart = startOfWeek(new Date());
  return dateFromDayMinutes(addDays(weekStart, dayOffset), hour * 60 + minute);
}

function todayAt(hour: number, minute = 0): Date {
  return dateFromDayMinutes(startOfDay(new Date()), hour * 60 + minute);
}

export function createSampleTimeBlocks(): TimeBlock[] {
  const todayOffset = Math.min(Math.max(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, 0), 6);

  return [
    {
      id: 'sample_morning',
      title: 'Deep Work',
      startAt: todayAt(9, 0),
      endAt: todayAt(11, 0),
      color: blockColorOptions[0],
    },
    {
      id: 'sample_lunch',
      title: 'Mittagspause',
      startAt: todayAt(12, 30),
      endAt: todayAt(13, 15),
      color: blockColorOptions[2],
    },
    {
      id: 'sample_afternoon',
      title: 'Projektplanung',
      startAt: todayAt(14, 0),
      endAt: todayAt(16, 0),
      color: blockColorOptions[4],
    },
    {
      id: 'sample_wednesday',
      title: 'Team-Meeting',
      startAt: dayAt((todayOffset + 1) % 7, 10, 0),
      endAt: dayAt((todayOffset + 1) % 7, 11, 30),
      color: blockColorOptions[1],
    },
    {
      id: 'sample_friday',
      title: 'Review',
      startAt: dayAt((todayOffset + 3) % 7, 15, 0),
      endAt: dayAt((todayOffset + 3) % 7, 16, 30),
      color: blockColorOptions[3],
    },
  ];
}
