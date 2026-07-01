import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GestureHandlerRootView,
  ScrollView,
  TextInput,
} from 'react-native-gesture-handler';
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

type ExpandedField = 'start' | 'end' | 'color' | null;

const START_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour * 60).filter(
  (minutes) => minutes >= 6 * 60 && minutes <= 20 * 60,
);

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

function TrashIcon() {
  return (
    <View style={styles.trashIcon}>
      <View style={styles.trashLid} />
      <View style={styles.trashBody}>
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
      </View>
    </View>
  );
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
  const [expandedField, setExpandedField] = useState<ExpandedField>(null);

  useEffect(() => {
    if (visible) {
      setValues(
        initialBlock
          ? blockToFormValues(initialBlock)
          : defaultFormValues(selectedDay, prefilledStartMinutes),
      );
      setExpandedField(null);
    }
  }, [visible, initialBlock, prefilledStartMinutes, selectedDay]);

  const endOptions = useMemo(() => {
    const options: number[] = [];
    for (let minutes = values.startMinutes + 15; minutes <= 22 * 60; minutes += 15) {
      options.push(minutes);
    }
    return options;
  }, [values.startMinutes]);

  const saveAndClose = useCallback(async () => {
    const payload = {
      ...values,
      title: values.title.trim() || 'Neuer Termin',
    };
    await onSubmit(payload);
    onClose();
  }, [onClose, onSubmit, values]);

  const toggleField = (field: ExpandedField) => {
    setExpandedField((current) => (current === field ? null : field));
  };

  const startLabel = formatTime(dateFromDayMinutes(selectedDay, values.startMinutes));
  const endLabel = formatTime(dateFromDayMinutes(selectedDay, values.endMinutes));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={() => void saveAndClose()}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropPress}
            onPress={() => void saveAndClose()}
            accessibilityRole="button"
            accessibilityLabel="Schließen"
          />
          <View style={styles.card} pointerEvents="box-none">
            <View style={styles.cardInner}>
              <View style={styles.headerRow}>
                <TextInput
                  value={values.title}
                  onChangeText={(title) => setValues((current) => ({ ...current, title }))}
                  placeholder={isEditing ? 'Titel' : 'Neuer Termin'}
                  placeholderTextColor={colors.textSecondary}
                  style={styles.titleInput}
                />
                {isEditing && onDelete ? (
                  <Pressable
                    onPress={() => void onDelete()}
                    style={styles.deleteButton}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Löschen"
                  >
                    <TrashIcon />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.timeRow}>
                <Pressable
                  onPress={() => toggleField('start')}
                  style={[
                    styles.timePill,
                    expandedField === 'start' && styles.timePillActive,
                  ]}
                >
                  <Text style={styles.timePillLabel}>Start</Text>
                  <Text style={styles.timePillValue}>{startLabel}</Text>
                </Pressable>

                <Text style={styles.timeSeparator}>–</Text>

                <Pressable
                  onPress={() => toggleField('end')}
                  style={[
                    styles.timePill,
                    expandedField === 'end' && styles.timePillActive,
                  ]}
                >
                  <Text style={styles.timePillLabel}>Ende</Text>
                  <Text style={styles.timePillValue}>{endLabel}</Text>
                </Pressable>
              </View>

              {expandedField === 'start' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pickerRow}
                  keyboardShouldPersistTaps="handled"
                >
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
              ) : null}

              {expandedField === 'end' ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pickerRow}
                  keyboardShouldPersistTaps="handled"
                >
                  {endOptions.map((minutes) => {
                    const label = formatTime(dateFromDayMinutes(selectedDay, minutes));
                    const selected = values.endMinutes === minutes;
                    return (
                      <Pressable
                        key={minutes}
                        onPress={() =>
                          setValues((current) => ({
                            ...current,
                            endMinutes: minutes,
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
              ) : null}

              <Pressable
                onPress={() => toggleField('color')}
                style={styles.colorTrigger}
              >
                <View
                  style={[
                    styles.colorPreview,
                    { backgroundColor: values.color },
                    expandedField === 'color' && styles.colorPreviewActive,
                  ]}
                />
                <Text style={styles.colorTriggerText}>Farbe</Text>
              </Pressable>

              {expandedField === 'color' ? (
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
              ) : null}
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    zIndex: 1,
  },
  cardInner: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 2,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  trashIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
  },
  trashLid: {
    width: 14,
    height: 3,
    borderRadius: 1,
    backgroundColor: colors.danger,
    marginBottom: 1,
  },
  trashBody: {
    width: 11,
    height: 10,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: colors.danger,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingTop: 2,
  },
  trashLine: {
    width: 1,
    height: 5,
    backgroundColor: colors.danger,
    borderRadius: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timePill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 2,
  },
  timePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  timePillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timePillValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  pickerRow: {
    flexGrow: 0,
    marginTop: -4,
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
  colorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  colorPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPreviewActive: {
    borderColor: colors.primary,
  },
  colorTriggerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: -6,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.primary,
  },
});
