import { useMemo } from 'react';
import { useCalendar } from '../store/CalendarProvider';
import { layoutTimeBlocks } from '../../../shared/utils/layout';

export function useDayTimeline(contentWidth: number) {
  const { config, blocks } = useCalendar();

  return useMemo(
    () => ({
      config,
      layouts: layoutTimeBlocks(blocks, config, contentWidth),
      blocks,
    }),
    [blocks, config, contentWidth],
  );
}
