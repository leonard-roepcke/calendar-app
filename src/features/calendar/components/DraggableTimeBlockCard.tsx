import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import type { TimeBlock, TimeBlockId } from '../../../domain/models/timeBlock';
import type { BlockLayout } from '../../../shared/utils/layout';
import {
  getTimelineMetrics,
  panTranslationToDeltas,
} from '../../../shared/utils/layout';
import { colors } from '../../../shared/theme/colors';
import { formatTime } from '../../../shared/utils/dateTime';

type HandleMode = 'move' | 'resizeStart' | 'resizeEnd';

interface DraggableTimeBlockCardProps {
  block: TimeBlock;
  layout: BlockLayout;
  config: CalendarConfig;
  columnWidth: number;
  scrollNativeGesture: ReturnType<typeof Gesture.Native>;
  onPress: () => void;
  onMove: (blockId: TimeBlockId, deltaDays: number, deltaMinutes: number) => void;
  onResizeStart: (blockId: TimeBlockId, deltaMinutes: number) => void;
  onResizeEnd: (blockId: TimeBlockId, deltaMinutes: number) => void;
  onInteractionChange: (active: boolean) => void;
}

export function DraggableTimeBlockCard({
  block,
  layout,
  config,
  columnWidth,
  scrollNativeGesture,
  onPress,
  onMove,
  onResizeStart,
  onResizeEnd,
  onInteractionChange,
}: DraggableTimeBlockCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const resizeTop = useSharedValue(0);
  const resizeHeight = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const baseHeight = layout.height;
  const minHeight = config.hourHeight / 4;
  const metrics = getTimelineMetrics(config);
  const snapMinutes = config.snapMinutes;

  const resetTransforms = useCallback(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    resizeTop.value = withSpring(0);
    resizeHeight.value = withSpring(0);
  }, [translateX, translateY, resizeTop, resizeHeight]);

  const finishMove = useCallback(
    (translationX: number, translationY: number) => {
      const { deltaDays, deltaMinutes } = panTranslationToDeltas(
        translationX,
        translationY,
        columnWidth,
        config,
      );
      if (deltaDays !== 0 || deltaMinutes !== 0) {
        onMove(block.id, deltaDays, deltaMinutes);
      }
    },
    [block.id, columnWidth, config, onMove],
  );

  const finishResizeStart = useCallback(
    (_translationX: number, translationY: number) => {
      const { deltaMinutes } = panTranslationToDeltas(
        0,
        translationY,
        columnWidth,
        config,
        true,
      );
      if (deltaMinutes !== 0) {
        onResizeStart(block.id, deltaMinutes);
      }
    },
    [block.id, columnWidth, config, onResizeStart],
  );

  const finishResizeEnd = useCallback(
    (_translationX: number, translationY: number) => {
      const { deltaMinutes } = panTranslationToDeltas(
        0,
        translationY,
        columnWidth,
        config,
        true,
      );
      if (deltaMinutes !== 0) {
        onResizeEnd(block.id, deltaMinutes);
      }
    },
    [block.id, columnWidth, config, onResizeEnd],
  );

  const createHandlePan = useCallback(
    (mode: HandleMode, onFinish: (tx: number, ty: number) => void) =>
      Gesture.Pan()
        .minDistance(0)
        .activeOffsetY([-6, 6])
        .activeOffsetX([-6, 6])
        .simultaneousWithExternalGesture(scrollNativeGesture)
        .onBegin(() => {
          isDragging.value = true;
          runOnJS(onInteractionChange)(true);
        })
        .onUpdate((event) => {
          'worklet';
          if (mode === 'move') {
            const deltaDays =
              columnWidth > 0 ? Math.round(event.translationX / columnWidth) : 0;
            const rawMinutes = event.translationY * metrics.minutesPerPixel;
            const deltaMinutes =
              Math.round(rawMinutes / snapMinutes) * snapMinutes;
            translateX.value = deltaDays * columnWidth;
            translateY.value = deltaMinutes / metrics.minutesPerPixel;
            return;
          }

          if (mode === 'resizeStart') {
            const rawMinutes = event.translationY * metrics.minutesPerPixel;
            const deltaMinutes =
              Math.round(rawMinutes / snapMinutes) * snapMinutes;
            const snappedY = deltaMinutes / metrics.minutesPerPixel;
            resizeTop.value = snappedY;
            resizeHeight.value = -snappedY;
            return;
          }

          const rawMinutes = event.translationY * metrics.minutesPerPixel;
          const deltaMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes;
          resizeHeight.value = deltaMinutes / metrics.minutesPerPixel;
        })
        .onEnd((event) => {
          'worklet';
          isDragging.value = false;
          runOnJS(onInteractionChange)(false);
          runOnJS(onFinish)(event.translationX, event.translationY);
          runOnJS(resetTransforms)();
        })
        .onFinalize((_event, success) => {
          'worklet';
          if (!success) {
            isDragging.value = false;
            runOnJS(onInteractionChange)(false);
            runOnJS(resetTransforms)();
          }
        }),
    [
      columnWidth,
      isDragging,
      metrics.minutesPerPixel,
      onInteractionChange,
      resetTransforms,
      resizeHeight,
      resizeTop,
      scrollNativeGesture,
      snapMinutes,
      translateX,
      translateY,
    ],
  );

  const movePan = createHandlePan('move', finishMove);
  const startPan = createHandlePan('resizeStart', finishResizeStart);
  const endPan = createHandlePan('resizeEnd', finishResizeEnd);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + resizeTop.value },
    ],
    height: Math.max(baseHeight + resizeHeight.value, minHeight),
    zIndex: isDragging.value ? 20 : 1,
    elevation: isDragging.value ? 8 : 2,
    opacity: isDragging.value ? 0.95 : 1,
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        {
          top: layout.top,
          left: layout.left,
          width: layout.width,
          backgroundColor: block.color ?? colors.timeBlockDefault,
        },
        animatedStyle,
      ]}
    >
      <Pressable onPress={onPress} style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {block.title}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {formatTime(block.startAt)} – {formatTime(block.endAt)}
        </Text>
      </Pressable>

      <GestureDetector gesture={startPan}>
        <View style={[styles.handle, styles.handleTopLeft]} collapsable={false}>
          <View style={[styles.dragDot, styles.dotResize]} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={movePan}>
        <View style={[styles.handle, styles.handleTopRight]} collapsable={false}>
          <View style={styles.dragDot} />
        </View>
      </GestureDetector>

      <GestureDetector gesture={endPan}>
        <View style={[styles.handle, styles.handleBottomRight]} collapsable={false}>
          <View style={[styles.dragDot, styles.dotResize]} />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

interface DraggableTimeBlockLayerProps {
  blocks: TimeBlock[];
  layouts: BlockLayout[];
  config: CalendarConfig;
  columnWidth: number;
  scrollNativeGesture: ReturnType<typeof Gesture.Native>;
  onBlockPress: (blockId: string) => void;
  onBlockMove: (blockId: TimeBlockId, deltaDays: number, deltaMinutes: number) => void;
  onBlockResizeStart: (blockId: TimeBlockId, deltaMinutes: number) => void;
  onBlockResizeEnd: (blockId: TimeBlockId, deltaMinutes: number) => void;
  onInteractionChange: (active: boolean) => void;
}

export function DraggableTimeBlockLayer({
  blocks,
  layouts,
  config,
  columnWidth,
  scrollNativeGesture,
  onBlockPress,
  onBlockMove,
  onBlockResizeStart,
  onBlockResizeEnd,
  onInteractionChange,
}: DraggableTimeBlockLayerProps) {
  const layoutById = new Map(layouts.map((item) => [item.blockId, item]));

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {blocks.map((block) => {
        const blockLayout = layoutById.get(block.id);
        if (!blockLayout) {
          return null;
        }

        return (
          <DraggableTimeBlockCard
            key={block.id}
            block={block}
            layout={blockLayout}
            config={config}
            columnWidth={columnWidth}
            scrollNativeGesture={scrollNativeGesture}
            onPress={() => onBlockPress(block.id)}
            onMove={onBlockMove}
            onResizeStart={onBlockResizeStart}
            onResizeEnd={onBlockResizeEnd}
            onInteractionChange={onInteractionChange}
          />
        );
      })}
    </View>
  );
}

const HANDLE_SIZE = 22;

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.timeBlockBorder,
    overflow: 'visible',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleTopLeft: {
    top: -HANDLE_SIZE / 2 + 2,
    left: -HANDLE_SIZE / 2 + 2,
  },
  handleTopRight: {
    top: -HANDLE_SIZE / 2 + 2,
    right: -HANDLE_SIZE / 2 + 2,
  },
  handleBottomRight: {
    bottom: -HANDLE_SIZE / 2 + 2,
    right: -HANDLE_SIZE / 2 + 2,
  },
  dragDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.textInverse,
  },
  dotResize: {
    backgroundColor: colors.textPrimary,
  },
});
