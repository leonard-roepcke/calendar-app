import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import { colors, blockColorOptions } from '../../../shared/theme/colors';
import {
  getTimelineMetrics,
  minutesToY,
  normalizeCreationRange,
  yToMinutes,
} from '../../../shared/utils/layout';
import { useWeekTimeline } from '../hooks/useWeekTimeline';
import { HourGrid, TimeColumn } from './HourGrid';
import { DraggableTimeBlockLayer } from './DraggableTimeBlockCard';

export interface SlotCreationDraft {
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
}

interface WeekTimelineProps {
  config: CalendarConfig;
  onSlotCreate: (dayIndex: number, startMinutes: number, endMinutes: number) => void;
  onBlockPress: (blockId: string) => void;
  onBlockMove: (blockId: string, deltaDays: number, deltaMinutes: number) => void;
  onBlockResizeStart: (
    blockId: string,
    deltaDays: number,
    deltaMinutes: number,
  ) => void;
  onBlockResizeEnd: (
    blockId: string,
    deltaDays: number,
    deltaMinutes: number,
  ) => void;
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

function CreationPreview({
  draft,
  config,
  columnWidth,
}: {
  draft: SlotCreationDraft;
  config: CalendarConfig;
  columnWidth: number;
}) {
  const metrics = getTimelineMetrics(config);
  const top = minutesToY(draft.startMinutes, config, metrics);
  const bottom = minutesToY(draft.endMinutes, config, metrics);
  const height = Math.max(bottom - top, config.hourHeight / 4);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.creationPreview,
        {
          top,
          left: draft.dayIndex * columnWidth + 2,
          width: columnWidth - 4,
          height,
        },
      ]}
    />
  );
}

export function WeekTimeline({
  config,
  onSlotCreate,
  onBlockPress,
  onBlockMove,
  onBlockResizeStart,
  onBlockResizeEnd,
}: WeekTimelineProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [creationDraft, setCreationDraft] = useState<SlotCreationDraft | null>(null);
  const { layouts, blocks, columnWidth } = useWeekTimeline(gridWidth);
  const metrics = getTimelineMetrics(config);

  const handleLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width);
  };

  const positionToSlot = useCallback(
    (x: number, y: number) => {
      if (columnWidth <= 0) {
        return null;
      }
      const dayIndex = Math.min(Math.max(Math.floor(x / columnWidth), 0), 6);
      const minutes = yToMinutes(y, config, metrics);
      return { dayIndex, minutes };
    },
    [columnWidth, config, metrics],
  );

  const beginCreation = useCallback(
    (x: number, y: number) => {
      const slot = positionToSlot(x, y);
      if (!slot) {
        return;
      }
      setScrollLocked(true);
      setCreationDraft({
        dayIndex: slot.dayIndex,
        startMinutes: slot.minutes,
        endMinutes: slot.minutes + config.snapMinutes,
      });
    },
    [config.snapMinutes, positionToSlot],
  );

  const updateCreation = useCallback(
    (x: number, y: number) => {
      setCreationDraft((current) => {
        if (!current) {
          return current;
        }
        const slot = positionToSlot(x, y);
        if (!slot) {
          return current;
        }
        const normalized = normalizeCreationRange(
          current.startMinutes,
          slot.minutes,
          config,
        );
        return {
          dayIndex: current.dayIndex,
          startMinutes: normalized.startMinutes,
          endMinutes: normalized.endMinutes,
        };
      });
    },
    [config, positionToSlot],
  );

  const finishCreation = useCallback(() => {
    setScrollLocked(false);
    setCreationDraft((current) => {
      if (current) {
        onSlotCreate(current.dayIndex, current.startMinutes, current.endMinutes);
      }
      return null;
    });
  }, [onSlotCreate]);

  const cancelCreation = useCallback(() => {
    setScrollLocked(false);
    setCreationDraft(null);
  }, []);

  const createGesture = Gesture.Pan()
    .activateAfterLongPress(400)
    .minDistance(0)
    .onStart((event) => {
      runOnJS(beginCreation)(event.x, event.y);
    })
    .onUpdate((event) => {
      runOnJS(updateCreation)(event.x, event.y);
    })
    .onEnd(() => {
      runOnJS(finishCreation)();
    })
    .onFinalize((_event, success) => {
      if (!success) {
        runOnJS(cancelCreation)();
      }
    });

  const handleBlockInteraction = useCallback((active: boolean) => {
    setScrollLocked(active);
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={!scrollLocked}
    >
      <View style={styles.row}>
        <TimeColumn config={config} />
        <View style={styles.gridArea} onLayout={handleLayout}>
          <WeekHourGrid config={config} columnCount={7} />
          <GestureDetector gesture={createGesture}>
            <View style={[styles.touchLayer, { height: metrics.totalHeight }]} />
          </GestureDetector>
          {creationDraft && columnWidth > 0 ? (
            <CreationPreview
              draft={creationDraft}
              config={config}
              columnWidth={columnWidth}
            />
          ) : null}
          {gridWidth > 0 ? (
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
    zIndex: 0,
  },
  creationPreview: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: blockColorOptions[0],
    opacity: 0.55,
    zIndex: 5,
  },
});
