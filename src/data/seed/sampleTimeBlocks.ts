import type { TimeBlock } from '../../domain/models/timeBlock';
import { blockColorOptions } from '../../shared/theme/colors';
import { dateFromDayMinutes, startOfDay } from '../../shared/utils/dateTime';

function todayAt(hour: number, minute = 0): Date {
  return dateFromDayMinutes(startOfDay(new Date()), hour * 60 + minute);
}

export function createSampleTimeBlocks(): TimeBlock[] {
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
  ];
}
