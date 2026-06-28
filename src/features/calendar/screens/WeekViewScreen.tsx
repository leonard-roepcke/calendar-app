import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { TimeBlock } from '../../../domain/models/timeBlock';
import { colors } from '../../../shared/theme/colors';
import { addDays, dateFromDayMinutes } from '../../../shared/utils/dateTime';
import {
  TimeBlockFormModal,
  type TimeBlockFormValues,
} from '../components/TimeBlockFormModal';
import { WeekDayColumnHeader } from '../components/WeekDayColumnHeader';
import { WeekHeader } from '../components/WeekHeader';
import { WeekTimeline } from '../components/WeekTimeline';
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
    goToToday,
    createBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    clearError,
  } = useCalendar();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [formDay, setFormDay] = useState<Date>(weekDays[0] ?? selectedWeekStart);
  const [prefilledStartMinutes, setPrefilledStartMinutes] = useState<number | null>(
    null,
  );

  const openCreateForm = (dayIndex?: number, startMinutes?: number) => {
    setEditingBlock(null);
    setFormDay(weekDays[dayIndex ?? 0] ?? selectedWeekStart);
    setPrefilledStartMinutes(startMinutes ?? null);
    setIsFormVisible(true);
  };

  const openEditForm = (blockId: string) => {
    const block = blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }
    setEditingBlock(block);
    setFormDay(block.startAt);
    setPrefilledStartMinutes(null);
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingBlock(null);
    setPrefilledStartMinutes(null);
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
      return;
    }

    await createBlock({
      title: values.title,
      startAt,
      endAt,
      color: values.color,
      notes: values.notes || undefined,
    });
  };

  const handleDelete = async () => {
    if (!editingBlock) {
      return;
    }
    await removeBlock(editingBlock.id);
    closeForm();
  };

  return (
    <SafeAreaView style={styles.container}>
      <WeekHeader
        weekStart={selectedWeekStart}
        onPrevious={goToPreviousWeek}
        onNext={goToNextWeek}
        onToday={goToToday}
      />
      <WeekDayColumnHeader weekDays={weekDays} />

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
        <WeekTimeline
          config={config}
          onSlotPress={(dayIndex, minutes) => openCreateForm(dayIndex, minutes)}
          onBlockPress={openEditForm}
          onBlockMove={(blockId, deltaDays, deltaMinutes) => {
            void moveBlock(blockId, deltaDays, deltaMinutes);
          }}
        />
      )}

      <Pressable style={styles.fab} onPress={() => openCreateForm()}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>

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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabLabel: {
    color: colors.textInverse,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '500',
  },
});
