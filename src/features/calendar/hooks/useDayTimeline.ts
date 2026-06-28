import { useMemo } from 'react';
import { useCalendar } from '../store/CalendarProvider';
import { layoutTimeBlocks } from '../../../shared/utils/layout';
import { isSameDay } from '../../../shared/utils/dateTime';

export function useDayTimeline(contentWidth: number, selectedDay: Date) {
  const { config, blocks } = useCalendar();

  const dayBlocks = useMemo(
    () => blocks.filter((block) => isSameDay(block.startAt, selectedDay)),
    [blocks, selectedDay],
  );

  return useMemo(
    () => ({
      config,
      layouts: layoutTimeBlocks(dayBlocks, config, contentWidth),
      blocks: dayBlocks,
    }),
    [dayBlocks, config, contentWidth],
  );
}
