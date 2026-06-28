import { useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import { colors } from '../../../shared/theme/colors';
import { getTimelineMetrics, TIMELINE_HORIZONTAL_PADDING, TIMELINE_SCROLL_BOTTOM_PADDING, yToMinutes } from '../../../shared/utils/layout';
import { useDayTimeline } from '../hooks/useDayTimeline';
import { HourGrid, TimeColumn } from './HourGrid';
import { TimeBlockLayer } from './TimeBlockCard';

interface DayTimelineProps {
  config: CalendarConfig;
  selectedDay: Date;
  onSlotPress: (minutesFromMidnight: number) => void;
  onBlockPress: (blockId: string) => void;
}

export function DayTimeline({
  config,
  selectedDay,
  onSlotPress,
  onBlockPress,
}: DayTimelineProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const { layouts, blocks } = useDayTimeline(contentWidth, selectedDay);
  const metrics = getTimelineMetrics(config);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContentWidth(event.nativeEvent.layout.width);
  };

  const handleTimelinePress = (event: { nativeEvent: { locationY: number } }) => {
    const minutes = yToMinutes(event.nativeEvent.locationY, config, metrics);
    onSlotPress(minutes);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: TIMELINE_SCROLL_BOTTOM_PADDING + 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.row}>
        <TimeColumn config={config} />
        <View style={styles.timelineArea} onLayout={handleLayout}>
          <HourGrid config={config} />
          <Pressable
            style={[styles.touchLayer, { height: metrics.totalHeight }]}
            onPress={handleTimelinePress}
          />
          {contentWidth > 0 ? (
            <TimeBlockLayer
              blocks={blocks}
              layouts={layouts}
              onBlockPress={onBlockPress}
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
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  timelineArea: {
    flex: 1,
    position: 'relative',
  },
  touchLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
