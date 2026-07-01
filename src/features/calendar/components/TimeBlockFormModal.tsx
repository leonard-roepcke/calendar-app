import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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

type TimeField = 'start' | 'end';

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

function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return '';
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins} Min`;
  }
  if (mins === 0) {
    return `${hours} Std`;
  }
  return `${hours} Std ${mins} Min`;
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
  const [iosPicker, setIosPicker] = useState<TimeField | null>(null);

  useEffect(() => {
    if (visible) {
      setValues(
        initialBlock
          ? blockToFormValues(initialBlock)
          : defaultFormValues(selectedDay, prefilledStartMinutes),
      );
      setIosPicker(null);
    }
  }, [visible, initialBlock, prefilledStartMinutes, selectedDay]);

  const saveAndClose = useCallback(async () => {
    const payload = {
      ...values,
      title: values.title.trim() || 'Neuer Termin',
    };
    await onSubmit(payload);
    onClose();
  }, [onClose, onSubmit, values]);

  const applyTime = useCallback((field: TimeField, minutes: number) => {
    setValues((current) => {
      if (field === 'start') {
        return {
          ...current,
          startMinutes: minutes,
          endMinutes: Math.max(current.endMinutes, minutes + 15),
        };
      }
      return {
        ...current,
        endMinutes: Math.max(minutes, current.startMinutes + 15),
      };
    });
  }, []);

  const openPicker = useCallback(
    (field: TimeField) => {
      const minutes = field === 'start' ? values.startMinutes : values.endMinutes;
      const base = dateFromDayMinutes(selectedDay, minutes);
      if (Platform.OS === 'android') {
        DateTimePickerAndroid.open({
          value: base,
          mode: 'time',
          is24Hour: true,
          onChange: (event: DateTimePickerEvent, date?: Date) => {
            if (event.type !== 'set' || !date) {
              return;
            }
            applyTime(field, date.getHours() * 60 + date.getMinutes());
          },
        });
      } else {
        setIosPicker(field);
      }
    },
    [applyTime, selectedDay, values.endMinutes, values.startMinutes],
  );

  const handleIosChange = useCallback(
    (field: TimeField) => (event: DateTimePickerEvent, date?: Date) => {
      if (event.type === 'dismissed' || !date) {
        setIosPicker(null);
        return;
      }
      applyTime(field, date.getHours() * 60 + date.getMinutes());
    },
    [applyTime],
  );

  const startLabel = formatTime(dateFromDayMinutes(selectedDay, values.startMinutes));
  const endLabel = formatTime(dateFromDayMinutes(selectedDay, values.endMinutes));
  const durationLabel = formatDuration(values.endMinutes - values.startMinutes);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => void saveAndClose()}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPress}
          onPress={() => void saveAndClose()}
          accessibilityRole="button"
          accessibilityLabel="Schließen"
        />
        <View style={styles.card} pointerEvents="box-none">
          <View style={styles.cardInner}>
            <View style={styles.accent} />

            <View style={styles.headerRow}>
              <View style={[styles.colorDot, { backgroundColor: values.color }]} />
              <TextInput
                value={values.title}
                onChangeText={(title) => setValues((current) => ({ ...current, title }))}
                placeholder="Titel"
                placeholderTextColor={colors.textSecondary}
                style={styles.titleInput}
              />
              {isEditing && onDelete ? (
                <Pressable
                  onPress={() => void onDelete()}
                  style={styles.deleteButton}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Termin löschen"
                >
                  <TrashIcon />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.timeRow}>
              <Pressable
                onPress={() => openPicker('start')}
                style={[
                  styles.timePill,
                  iosPicker === 'start' && styles.timePillActive,
                ]}
              >
                <Text style={styles.timePillLabel}>Start</Text>
                <Text style={styles.timePillValue}>{startLabel}</Text>
              </Pressable>

              <View style={styles.arrow}>
                <View style={styles.arrowLine} />
              </View>

              <Pressable
                onPress={() => openPicker('end')}
                style={[
                  styles.timePill,
                  iosPicker === 'end' && styles.timePillActive,
                ]}
              >
                <Text style={styles.timePillLabel}>Ende</Text>
                <Text style={styles.timePillValue}>{endLabel}</Text>
              </Pressable>
            </View>

            {durationLabel ? (
              <Text style={styles.durationLabel}>Dauer: {durationLabel}</Text>
            ) : null}

            {iosPicker ? (
              <DateTimePicker
                value={dateFromDayMinutes(
                  selectedDay,
                  iosPicker === 'start' ? values.startMinutes : values.endMinutes,
                )}
                mode="time"
                display="spinner"
                is24Hour
                onChange={handleIosChange(iosPicker)}
              />
            ) : null}

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Farbe</Text>
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
                    accessibilityRole="button"
                    accessibilityLabel={`Farbe ${color}`}
                  />
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Notizen</Text>
            <TextInput
              value={values.notes}
              onChangeText={(notes) => setValues((current) => ({ ...current, notes }))}
              placeholder="Notiz hinzufügen…"
              placeholderTextColor={colors.textSecondary}
              style={styles.notesInput}
              multiline
            />

            <Pressable
              onPress={() => void saveAndClose()}
              style={styles.saveButton}
              accessibilityRole="button"
              accessibilityLabel="Speichern"
            >
              <Text style={styles.saveButtonText}>Fertig</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
  },
  cardInner: {
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 16,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 2,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    borderRadius: 16,
    borderWidth: 1.5,
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
    letterSpacing: 0.5,
  },
  timePillValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  arrow: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textSecondary,
  },
  durationLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -4,
  },
  pickerRow: {
    flexGrow: 0,
  },
  pickerContent: {
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  chipTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: colors.textPrimary,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
