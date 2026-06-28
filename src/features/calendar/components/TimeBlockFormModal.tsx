import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

const START_OPTIONS = [8 * 60, 9 * 60, 10 * 60, 11 * 60, 13 * 60, 14 * 60, 15 * 60];
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

  const [values, setValues] = useState<TimeBlockFormValues>(() =>
    initialBlock
      ? blockToFormValues(initialBlock)
      : defaultFormValues(selectedDay, prefilledStartMinutes),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setValues(
        initialBlock
          ? blockToFormValues(initialBlock)
          : defaultFormValues(selectedDay, prefilledStartMinutes),
      );
    }
  }, [visible, initialBlock, prefilledStartMinutes, selectedDay]);

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSubmit(values);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>
            {isEditing ? 'Time-Block bearbeiten' : 'Neuer Time-Block'}
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

          <View style={styles.actions}>
            {isEditing && onDelete ? (
              <Pressable onPress={() => void onDelete()} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Löschen</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View style={styles.primaryActions}>
              <Pressable onPress={onClose} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSubmit()}
                disabled={isSaving}
                style={[styles.primaryButton, isSaving && styles.disabledButton]}
              >
                <Text style={styles.primaryText}>
                  {isSaving ? 'Speichern…' : 'Speichern'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 8,
    maxHeight: '88%',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryText: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  secondaryText: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 12,
  },
  deleteText: {
    color: colors.danger,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
