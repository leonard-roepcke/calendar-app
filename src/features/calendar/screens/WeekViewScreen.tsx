import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TimeBlock } from '../../../domain/models/timeBlock';
import { blockColorOptions, colors } from '../../../shared/theme/colors';
import { dateFromDayMinutes } from '../../../shared/utils/dateTime';
import {
  TimeBlockFormModal,
  type TimeBlockFormValues,
} from '../components/TimeBlockFormModal';
import { WeekSwipeContainer } from '../components/WeekSwipeContainer';
import { WeekTimeline } from '../components/WeekTimeline';
import { WeekToolbar } from '../components/WeekToolbar';
import { useCalendar } from '../store/CalendarProvider';

export function WeekViewScreen() {
  const {
    config,
    selectedWeekStart,
    weekDays,
    blocks,
    isLoading,
    error,
    goToPreviousWeek,
    goToNextWeek,
    createBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    resizeBlockStart,
    resizeBlockEnd,
    clearError,
  } = useCalendar();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [formDay, setFormDay] = useState<Date>(weekDays[0] ?? selectedWeekStart);
  const [prefilledStartMinutes, setPrefilledStartMinutes] = useState<number | null>(
    null,
  );
  const scrollNativeGesture = useMemo(() => Gesture.Native(), []);

  const openEditForm = (block: TimeBlock) => {
    setEditingBlock(block);
    setFormDay(block.startAt);
    setPrefilledStartMinutes(null);
    setIsFormVisible(true);
  };

  const openEditFormById = (blockId: string) => {
    const block = blocks.find((item) => item.id === blockId);
    if (block) {
      openEditForm(block);
    }
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingBlock(null);
    setPrefilledStartMinutes(null);
  };

  const handleSlotCreate = async (
    dayIndex: number,
    startMinutes: number,
    endMinutes: number,
  ) => {
    const day = weekDays[dayIndex] ?? selectedWeekStart;
    const block = await createBlock({
      title: 'Neuer Termin',
      startAt: dateFromDayMinutes(day, startMinutes),
      endAt: dateFromDayMinutes(day, endMinutes),
      color: blockColorOptions[0],
    });
    openEditForm(block);
  };

  const handleSubmit = async (values: TimeBlockFormValues) => {
    const startAt = dateFromDayMinutes(formDay, values.startMinutes);
    const endAt = dateFromDayMinutes(formDay, values.endMinutes);

    if (editingBlock) {
      await updateBlock({
        id: editingBlock.id,
        title: values.title,
        startAt,
        endAt,
        color: values.color,
        notes: values.notes || undefined,
      });
    }
  };

  const handleDelete = async () => {
    if (!editingBlock) {
      return;
    }
    await removeBlock(editingBlock.id);
    closeForm();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {error ? (
        <Pressable style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorText}>{error}</Text>
        </Pressable>
      ) : null}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <WeekSwipeContainer
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          scrollNativeGesture={scrollNativeGesture}
        >
          <WeekToolbar weekDays={weekDays} />
          <WeekTimeline
            config={config}
            scrollNativeGesture={scrollNativeGesture}
            onSlotCreate={(dayIndex, startMinutes, endMinutes) => {
              void handleSlotCreate(dayIndex, startMinutes, endMinutes);
            }}
            onBlockPress={openEditFormById}
            onBlockMove={(blockId, deltaDays, deltaMinutes) => {
              void moveBlock(blockId, deltaDays, deltaMinutes);
            }}
            onBlockResizeStart={(blockId, deltaMinutes) => {
              void resizeBlockStart(blockId, deltaMinutes);
            }}
            onBlockResizeEnd={(blockId, deltaMinutes) => {
              void resizeBlockEnd(blockId, deltaMinutes);
            }}
          />
        </WeekSwipeContainer>
      )}

      <TimeBlockFormModal
        visible={isFormVisible}
        selectedDay={formDay}
        initialBlock={editingBlock}
        prefilledStartMinutes={prefilledStartMinutes}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onDelete={editingBlock ? handleDelete : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
});
