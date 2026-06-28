import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TimeBlock } from '../../../domain/models/timeBlock';
import type { BlockLayout } from '../../../shared/utils/layout';
import { colors } from '../../../shared/theme/colors';
import { formatTime } from '../../../shared/utils/dateTime';

interface TimeBlockCardProps {
  block: TimeBlock;
  layout: BlockLayout;
  onPress: () => void;
}

export function TimeBlockCard({ block, layout, onPress }: TimeBlockCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          top: layout.top,
          left: layout.left,
          width: layout.width,
          height: layout.height,
          backgroundColor: block.color ?? colors.timeBlockDefault,
        },
      ]}
    >
      <Text style={styles.title} numberOfLines={1}>
        {block.title}
      </Text>
      <Text style={styles.time} numberOfLines={1}>
        {formatTime(block.startAt)} – {formatTime(block.endAt)}
      </Text>
    </Pressable>
  );
}

interface TimeBlockLayerProps {
  blocks: TimeBlock[];
  layouts: BlockLayout[];
  onBlockPress: (blockId: string) => void;
}

export function TimeBlockLayer({
  blocks,
  layouts,
  onBlockPress,
}: TimeBlockLayerProps) {
  const layoutById = new Map(layouts.map((layout) => [layout.blockId, layout]));

  return (
    <View style={styles.layer} pointerEvents="box-none">
      {blocks.map((block) => {
        const layout = layoutById.get(block.id);
        if (!layout) {
          return null;
        }

        return (
          <TimeBlockCard
            key={block.id}
            block={block}
            layout={layout}
            onPress={() => onBlockPress(block.id)}
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.timeBlockBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
