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
import { getTimelineMetrics } from '../../../shared/utils/layout';
import { colors } from '../../../shared/theme/colors';
import { formatTime } from '../../../shared/utils/dateTime';

interface DraggableTimeBlockCardProps {
  block: TimeBlock;
  layout: BlockLayout;
  config: CalendarConfig;
  columnWidth: number;
  onPress: () => void;
  onMove: (blockId: TimeBlockId, deltaDays: number, deltaMinutes: number) => void;
}

export function DraggableTimeBlockCard({
  block,
  layout,
  config,
  columnWidth,
  onPress,
  onMove,
}: DraggableTimeBlockCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const finishMove = (translationX: number, translationY: number) => {
    if (columnWidth <= 0) {
      return;
    }
    const deltaDays = Math.round(translationX / columnWidth);
    const metrics = getTimelineMetrics(config);
    const rawMinutes = translationY * metrics.minutesPerPixel;
    const deltaMinutes =
      Math.round(rawMinutes / config.snapMinutes) * config.snapMinutes;
    if (deltaDays !== 0 || deltaMinutes !== 0) {
      onMove(block.id, deltaDays, deltaMinutes);
    }
  };

  const pan = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      isDragging.value = false;
      runOnJS(finishMove)(event.translationX, event.translationY);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
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
          height: layout.height,
          backgroundColor: block.color ?? colors.timeBlockDefault,
        },
        animatedStyle,
      ]}
    >
      <Pressable onPress={onPress} style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {block.title}
        </Text>
        <Text style={styles.time} numberOfLines={1}>
          {formatTime(block.startAt)} – {formatTime(block.endAt)}
        </Text>
      </Pressable>
      <GestureDetector gesture={pan}>
        <Animated.View style={styles.dragHandle} hitSlop={8}>
          <View style={styles.dragDot} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

interface DraggableTimeBlockLayerProps {
  blocks: TimeBlock[];
  layouts: BlockLayout[];
  config: CalendarConfig;
  columnWidth: number;
  onBlockPress: (blockId: string) => void;
  onBlockMove: (blockId: TimeBlockId, deltaDays: number, deltaMinutes: number) => void;
}

export function DraggableTimeBlockLayer({
  blocks,
  layouts,
  config,
  columnWidth,
  onBlockPress,
  onBlockMove,
}: DraggableTimeBlockLayerProps) {
  const layoutById = new Map(layouts.map((layout) => [layout.blockId, layout]));

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {blocks.map((block) => {
        const layout = layoutById.get(block.id);
        if (!layout) {
          return null;
        }

        return (
          <DraggableTimeBlockCard
            key={block.id}
            block={block}
            layout={layout}
            config={config}
            columnWidth={columnWidth}
            onPress={() => onBlockPress(block.id)}
            onMove={onBlockMove}
          />
        );
      })}
    </View>
  );
}

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
    paddingHorizontal: 6,
    paddingVertical: 4,
    paddingRight: 18,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
  },
  dragHandle: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.textInverse,
  },
});
