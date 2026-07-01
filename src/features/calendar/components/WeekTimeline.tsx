import { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import { colors } from '../../../shared/theme/colors';
import {
  getTimelineMetrics,
  TIMELINE_HORIZONTAL_PADDING,
  TIMELINE_SCROLL_BOTTOM_PADDING,
} from '../../../shared/utils/layout';
import { useWeekTimeline } from '../hooks/useWeekTimeline';
import { HourGrid, TimeColumn } from './HourGrid';
import { DraggableTimeBlockLayer } from './DraggableTimeBlockCard';

interface WeekTimelineProps {
  config: CalendarConfig;
  weekStart: Date;
  interactive?: boolean;
  onBlockPress: (blockId: string) => void;
  onBlockMove: (blockId: string, deltaDays: number, deltaMinutes: number) => void;
  onBlockResizeStart: (blockId: string, deltaMinutes: number) => void;
  onBlockResizeEnd: (blockId: string, deltaMinutes: number) => void;
}

function WeekHourGrid({
  config,
  columnCount,
}: {
  config: CalendarConfig;
  columnCount: number;
}) {
  const metrics = getTimelineMetrics(config);

  return (
    <View
      pointerEvents="none"
      style={[styles.weekGrid, { height: metrics.totalHeight }]}
    >
      <HourGrid config={config} />
      {Array.from({ length: columnCount - 1 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dayDivider,
            {
              left: `${((index + 1) / columnCount) * 100}%`,
              height: metrics.totalHeight,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function WeekTimeline({
  config,
  weekStart,
  interactive = true,
  onBlockPress,
  onBlockMove,
  onBlockResizeStart,
  onBlockResizeEnd,
}: WeekTimelineProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const { layouts, blocks, columnWidth } = useWeekTimeline(gridWidth, weekStart);
  const metrics = getTimelineMetrics(config);

  const handleLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width);
  };

  const handleBlockInteraction = useCallback((active: boolean) => {
    setScrollLocked(active);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: TIMELINE_SCROLL_BOTTOM_PADDING,
          minHeight: metrics.totalHeight + TIMELINE_SCROLL_BOTTOM_PADDING,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={interactive && !scrollLocked}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
      >
        <View style={[styles.row, { minHeight: metrics.totalHeight }]}>
          <TimeColumn config={config} />
          <View
            style={[styles.gridArea, { height: metrics.totalHeight }]}
            onLayout={handleLayout}
            collapsable={false}
            pointerEvents="box-none"
          >
            <WeekHourGrid config={config} columnCount={7} />

            {gridWidth > 0 && interactive ? (
              <DraggableTimeBlockLayer
                blocks={blocks}
                layouts={layouts}
                config={config}
                columnWidth={columnWidth}
                onBlockPress={onBlockPress}
                onBlockMove={onBlockMove}
                onBlockResizeStart={onBlockResizeStart}
                onBlockResizeEnd={onBlockResizeEnd}
                onInteractionChange={handleBlockInteraction}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
    paddingTop: 4,
  },
  gridArea: {
    flex: 1,
    position: 'relative',
  },
  weekGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  dayDivider: {
    position: 'absolute',
    top: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.gridLine,
  },
});
