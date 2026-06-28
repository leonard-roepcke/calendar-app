import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { TimeBlock } from '../../../domain/models/timeBlock';
import { blockColorOptions, colors } from '../../../shared/theme/colors';
import {
  dateFromDayMinutes,
  formatTime,
  minutesSinceStartOfDay,
} from '../../../shared/utils/dateTime';

export interface TimeBlockFormValues {
  title: string;
  startMinutes: number;
  endMinutes: number;
  color: string;
  notes: string;
}

interface TimeBlockFormModalProps {
  visible: boolean;
  selectedDay: Date;
  initialBlock?: TimeBlock | null;
  prefilledStartMinutes?: number | null;
  onClose: () => void;
  onSubmit: (values: TimeBlockFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const START_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour * 60).filter(
  (minutes) => minutes >= 6 * 60 && minutes <= 20 * 60,
);
const DURATION_OPTIONS = [30, 45, 60, 90, 120];

function blockToFormValues(block: TimeBlock): TimeBlockFormValues {
  return {
    title: block.title,
    startMinutes: minutesSinceStartOfDay(block.startAt),
    endMinutes: minutesSinceStartOfDay(block.endAt),
    color: block.color ?? blockColorOptions[0],
    notes: block.notes ?? '',
  };
}

function defaultFormValues(
  selectedDay: Date,
  prefilledStartMinutes?: number | null,
): TimeBlockFormValues {
  const now = new Date();
  const baseMinutes =
    prefilledStartMinutes ??
    (now.toDateString() === selectedDay.toDateString()
      ? Math.ceil(minutesSinceStartOfDay(now) / 15) * 15
      : 9 * 60);

  return {
    title: '',
    startMinutes: baseMinutes,
    endMinutes: baseMinutes + 60,
    color: blockColorOptions[0],
    notes: '',
  };
}

export function TimeBlockFormModal({
  visible,
  selectedDay,
  initialBlock,
  prefilledStartMinutes,
  onClose,
  onSubmit,
  onDelete,
}: TimeBlockFormModalProps) {
  const isEditing = Boolean(initialBlock);
  const sheetOffset = useSharedValue(0);

  const [values, setValues] = useState<TimeBlockFormValues>(() =>
    initialBlock
      ? blockToFormValues(initialBlock)
      : defaultFormValues(selectedDay, prefilledStartMinutes),
  );

  useEffect(() => {
    if (visible) {
      sheetOffset.value = 0;
      setValues(
        initialBlock
          ? blockToFormValues(initialBlock)
          : defaultFormValues(selectedDay, prefilledStartMinutes),
      );
    }
  }, [visible, initialBlock, prefilledStartMinutes, selectedDay, sheetOffset]);

  const dismiss = useCallback(async () => {
    const payload = {
      ...values,
      title: values.title.trim() || 'Neuer Termin',
    };
    await onSubmit(payload);
    onClose();
  }, [onClose, onSubmit, values]);

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        sheetOffset.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 800) {
        runOnJS(dismiss)();
        return;
      }
      sheetOffset.value = withSpring(0);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetOffset.value }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => void dismiss()}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={() => void dismiss()} />
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.sheet, sheetStyle]}>
            <View style={styles.dragHandle} />
            <Text style={styles.heading}>
              {isEditing ? 'Time-Block bearbeiten' : 'Neuer Time-Block'}
            </Text>
            <Text style={styles.hint}>
              Nach unten wischen oder außerhalb tippen zum Schließen
            </Text>

            <Text style={styles.label}>Titel</Text>
            <TextInput
              value={values.title}
              onChangeText={(title) => setValues((current) => ({ ...current, title }))}
              placeholder="z. B. Deep Work"
              style={styles.input}
            />

            <Text style={styles.label}>Start</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {START_OPTIONS.map((minutes) => {
                const label = formatTime(dateFromDayMinutes(selectedDay, minutes));
                const selected = values.startMinutes === minutes;
                return (
                  <Pressable
                    key={minutes}
                    onPress={() =>
                      setValues((current) => ({
                        ...current,
                        startMinutes: minutes,
                        endMinutes: Math.max(current.endMinutes, minutes + 15),
                      }))
                    }
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Dauer</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {DURATION_OPTIONS.map((duration) => {
                const selected = values.endMinutes - values.startMinutes === duration;
                return (
                  <Pressable
                    key={duration}
                    onPress={() =>
                      setValues((current) => ({
                        ...current,
                        endMinutes: current.startMinutes + duration,
                      }))
                    }
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {duration} Min
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Farbe</Text>
            <View style={styles.colorRow}>
              {blockColorOptions.map((color) => {
                const selected = values.color === color;
                return (
                  <Pressable
                    key={color}
                    onPress={() => setValues((current) => ({ ...current, color }))}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      selected && styles.colorSwatchSelected,
                    ]}
                  />
                );
              })}
            </View>

            <Text style={styles.label}>Notizen</Text>
            <TextInput
              value={values.notes}
              onChangeText={(notes) => setValues((current) => ({ ...current, notes }))}
              placeholder="Optional"
              style={[styles.input, styles.notesInput]}
              multiline
            />

            {isEditing && onDelete ? (
              <Pressable onPress={() => void onDelete()} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Löschen</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 10,
    gap: 8,
    maxHeight: '88%',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  notesInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexGrow: 0,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.primary,
  },
  deleteButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
