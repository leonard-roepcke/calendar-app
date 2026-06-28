import { useMemo } from 'react';
import { useCalendar } from '../store/CalendarProvider';
import { layoutTimeBlocksForWeek } from '../../../shared/utils/layout';

export function useWeekTimeline(gridWidth: number) {
  const { config, blocks, selectedWeekStart } = useCalendar();

  return useMemo(
    () => ({
      config,
      layouts: layoutTimeBlocksForWeek(blocks, selectedWeekStart, config, gridWidth),
      blocks,
      columnWidth: gridWidth > 0 ? gridWidth / 7 : 0,
    }),
    [blocks, config, gridWidth, selectedWeekStart],
  );
}
