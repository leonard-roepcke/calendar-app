import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import { colors } from '../../../shared/theme/colors';
import { getTimelineMetrics, yToMinutes } from '../../../shared/utils/layout';
import { useWeekTimeline } from '../hooks/useWeekTimeline';
import { HourGrid, TimeColumn } from './HourGrid';
import { DraggableTimeBlockLayer } from './DraggableTimeBlockCard';

interface WeekTimelineProps {
  config: CalendarConfig;
  onSlotPress: (dayIndex: number, minutesFromMidnight: number) => void;
  onBlockPress: (blockId: string) => void;
  onBlockMove: (blockId: string, deltaDays: number, deltaMinutes: number) => void;
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
    <View style={[styles.weekGrid, { height: metrics.totalHeight }]}>
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
  onSlotPress,
  onBlockPress,
  onBlockMove,
}: WeekTimelineProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const { layouts, blocks, columnWidth } = useWeekTimeline(gridWidth);
  const metrics = getTimelineMetrics(config);

  const handleLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width);
  };

  const handleTimelinePress = (event: {
    nativeEvent: { locationX: number; locationY: number };
  }) => {
    if (gridWidth <= 0) {
      return;
    }
    const dayIndex = Math.min(
      Math.max(Math.floor(event.nativeEvent.locationX / columnWidth), 0),
      6,
    );
    const minutes = yToMinutes(event.nativeEvent.locationY, config, metrics);
    onSlotPress(dayIndex, minutes);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.row}>
        <TimeColumn config={config} />
        <View style={styles.gridArea} onLayout={handleLayout}>
          <WeekHourGrid config={config} columnCount={7} />
          <Pressable
            style={[styles.touchLayer, { height: metrics.totalHeight }]}
            onPress={handleTimelinePress}
          />
          {gridWidth > 0 ? (
            <DraggableTimeBlockLayer
              blocks={blocks}
              layouts={layouts}
              config={config}
              columnWidth={columnWidth}
              onBlockPress={onBlockPress}
              onBlockMove={onBlockMove}
            />
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 8,
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
  touchLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
