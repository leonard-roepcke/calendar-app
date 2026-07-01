import { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import { colors, blockColorOptions } from '../../../shared/theme/colors';
import {
  getTimelineMetrics,
  minutesToY,
  normalizeCreationRange,
  TIMELINE_HORIZONTAL_PADDING,
  TIMELINE_SCROLL_BOTTOM_PADDING,
  yToMinutes,
} from '../../../shared/utils/layout';
import { useWeekTimeline } from '../hooks/useWeekTimeline';
import { HourGrid, TimeColumn } from './HourGrid';
import { DraggableTimeBlockLayer } from './DraggableTimeBlockCard';
import { TimeBlockLayer } from './TimeBlockCard';

export interface SlotCreationDraft {
  dayIndex: number;
  startMinutes: number;
  endMinutes: number;
}

interface WeekTimelineProps {
  config: CalendarConfig;
  weekStart: Date;
  interactive?: boolean;
  initialScrollY?: number;
  onSlotCreate: (dayIndex: number, startMinutes: number, endMinutes: number) => void;
  onBlockPress: (blockId: string) => void;
  onBlockMove: (blockId: string, deltaDays: number, deltaMinutes: number) => void;
  onBlockResizeStart: (blockId: string, deltaMinutes: number) => void;
  onBlockResizeEnd: (blockId: string, deltaMinutes: number) => void;
  onZoom?: (nextHourHeight: number) => void;
  onVerticalScroll?: (y: number) => void;
  registerScrollRef?: (node: ScrollView | null) => void;
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
  weekStart,
  interactive = true,
  initialScrollY = 0,
  onSlotCreate,
  onBlockPress,
  onBlockMove,
  onBlockResizeStart,
  onBlockResizeEnd,
  onZoom,
  onVerticalScroll,
  registerScrollRef,
}: WeekTimelineProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);
  const [creationDraft, setCreationDraft] = useState<SlotCreationDraft | null>(null);
  const { layouts, blocks, columnWidth } = useWeekTimeline(gridWidth, weekStart);
  const metrics = getTimelineMetrics(config);

  const hourHeightRef = useRef(config.hourHeight);
  hourHeightRef.current = config.hourHeight;
  const pinchBaseRef = useRef(config.hourHeight);
  const lastZoomRef = useRef(config.hourHeight);

  const handleLayout = (event: LayoutChangeEvent) => {
    setGridWidth(event.nativeEvent.layout.width);
  };

  const capturePinchBase = useCallback(() => {
    pinchBaseRef.current = hourHeightRef.current;
    lastZoomRef.current = hourHeightRef.current;
  }, []);

  const applyZoom = useCallback(
    (scale: number) => {
      if (!onZoom) {
        return;
      }
      const next = Math.round(pinchBaseRef.current * scale);
      if (next !== lastZoomRef.current) {
        lastZoomRef.current = next;
        onZoom(next);
      }
    },
    [onZoom],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onVerticalScroll?.(event.nativeEvent.contentOffset.y);
    },
    [onVerticalScroll],
  );

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
        endMinutes: slot.minutes,
      });
    },
    [positionToSlot],
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
        if (slot.minutes === current.startMinutes) {
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
      if (current && current.endMinutes > current.startMinutes) {
        onSlotCreate(current.dayIndex, current.startMinutes, current.endMinutes);
      }
      return null;
    });
  }, [onSlotCreate]);

  const cancelCreation = useCallback(() => {
    setScrollLocked(false);
    setCreationDraft(null);
  }, []);

  const createGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(interactive)
        .activateAfterLongPress(400)
        .maxPointers(1)
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
        }),
    [beginCreation, cancelCreation, finishCreation, interactive, updateCreation],
  );

  const handleBlockInteraction = useCallback((active: boolean) => {
    setScrollLocked(active);
  }, []);

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(interactive && Boolean(onZoom))
        .onStart(() => {
          runOnJS(capturePinchBase)();
        })
        .onUpdate((event) => {
          runOnJS(applyZoom)(event.scale);
        }),
    [applyZoom, capturePinchBase, interactive, onZoom],
  );

  const showCreationPreview =
    creationDraft !== null &&
    creationDraft.endMinutes > creationDraft.startMinutes;

  return (
    <GestureDetector gesture={pinchGesture}>
    <View style={styles.container}>
      <ScrollView
        ref={registerScrollRef}
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
        contentOffset={{ x: 0, y: initialScrollY }}
        onScroll={interactive ? handleScroll : undefined}
        scrollEventThrottle={16}
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

            {interactive ? (
              <GestureDetector gesture={createGesture}>
                <View
                  style={styles.creationCapture}
                  accessibilityRole="button"
                  accessibilityLabel="Termin per Langdruck erstellen"
                />
              </GestureDetector>
            ) : null}

            {showCreationPreview && creationDraft && columnWidth > 0 ? (
              <CreationPreview
                draft={creationDraft}
                config={config}
                columnWidth={columnWidth}
              />
            ) : null}

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

            {gridWidth > 0 && !interactive ? (
              <TimeBlockLayer
                blocks={blocks}
                layouts={layouts}
                onBlockPress={onBlockPress}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
    </GestureDetector>
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
  creationCapture: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
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
  creationPreview: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: blockColorOptions[0],
    opacity: 0.55,
    zIndex: 3,
  },
});
