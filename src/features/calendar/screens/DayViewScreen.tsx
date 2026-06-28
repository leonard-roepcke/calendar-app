import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TimeBlock } from '../../../domain/models/timeBlock';
import { colors } from '../../../shared/theme/colors';
import { addDays, dateFromDayMinutes, startOfDay } from '../../../shared/utils/dateTime';
import { DayHeader } from '../components/DayHeader';
import { DayTimeline } from '../components/DayTimeline';
import {
  TimeBlockFormModal,
  type TimeBlockFormValues,
} from '../components/TimeBlockFormModal';
import { useCalendar } from '../store/CalendarProvider';

export function DayViewScreen() {
  const {
    config,
    blocks,
    isLoading,
    error,
    goToToday,
    createBlock,
    updateBlock,
    removeBlock,
    clearError,
  } = useCalendar();

  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [prefilledStartMinutes, setPrefilledStartMinutes] = useState<number | null>(
    null,
  );

  const openCreateForm = (startMinutes?: number) => {
    setEditingBlock(null);
    setPrefilledStartMinutes(startMinutes ?? null);
    setIsFormVisible(true);
  };

  const openEditForm = (blockId: string) => {
    const block = blocks.find((item) => item.id === blockId);
    if (!block) {
      return;
    }
    setEditingBlock(block);
    setPrefilledStartMinutes(null);
    setIsFormVisible(true);
  };

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingBlock(null);
    setPrefilledStartMinutes(null);
  };

  const handleSubmit = async (values: TimeBlockFormValues) => {
    const startAt = dateFromDayMinutes(selectedDay, values.startMinutes);
    const endAt = dateFromDayMinutes(selectedDay, values.endMinutes);

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <DayHeader
        selectedDay={selectedDay}
        onPrevious={() => setSelectedDay((day) => addDays(day, -1))}
        onNext={() => setSelectedDay((day) => addDays(day, 1))}
        onToday={() => {
          setSelectedDay(startOfDay(new Date()));
          goToToday();
        }}
      />

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
        <DayTimeline
          config={config}
          selectedDay={selectedDay}
          onSlotPress={(minutes) => openCreateForm(minutes)}
          onBlockPress={openEditForm}
        />
      )}

      <Pressable style={styles.fab} onPress={() => openCreateForm()}>
        <Text style={styles.fabLabel}>+</Text>
      </Pressable>

      <TimeBlockFormModal
        visible={isFormVisible}
        selectedDay={selectedDay}
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
