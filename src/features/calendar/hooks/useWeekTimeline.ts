import { useMemo } from 'react';
import { useCalendar } from '../store/CalendarProvider';
import { layoutTimeBlocksForWeek } from '../../../shared/utils/layout';

export function useWeekTimeline(gridWidth: number, weekStart?: Date) {
  const { config, blocks, selectedWeekStart } = useCalendar();
  const effectiveWeekStart = weekStart ?? selectedWeekStart;

  return useMemo(
    () => ({
      config,
      layouts: layoutTimeBlocksForWeek(
        blocks,
        effectiveWeekStart,
        config,
        gridWidth,
      ),
      blocks,
      columnWidth: gridWidth > 0 ? gridWidth / 7 : 0,
    }),
    [blocks, config, effectiveWeekStart, gridWidth],
  );
}
