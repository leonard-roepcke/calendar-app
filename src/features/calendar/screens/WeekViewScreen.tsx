import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TimeBlock } from '../../../domain/models/timeBlock';
import { blockColorOptions, colors } from '../../../shared/theme/colors';
import { addDays, dateFromDayMinutes, getWeekDays } from '../../../shared/utils/dateTime';
import {
  TimeBlockFormModal,
  type TimeBlockFormValues,
} from '../components/TimeBlockFormModal';
import { WeekPager } from '../components/WeekPager';
import { WeekTimeline } from '../components/WeekTimeline';
import { WeekToolbar } from '../components/WeekToolbar';
import { useCalendar } from '../store/CalendarProvider';

const DEFAULT_CREATE_MINUTES = 9 * 60;
const DEFAULT_CREATE_DURATION = 60;

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
    setHourHeight,
    clearError,
  } = useCalendar();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [formDay, setFormDay] = useState<Date>(weekDays[0] ?? selectedWeekStart);
  const [prefilledStartMinutes, setPrefilledStartMinutes] = useState<number | null>(
    null,
  );

  const scrollYRef = useRef(0);
  const scrollRefs = useRef<Record<number, ScrollView | null>>({});

  const syncScroll = useCallback((y: number) => {
    scrollYRef.current = y;
    [-1, 1].forEach((offset) => {
      scrollRefs.current[offset]?.scrollTo({ y, animated: false });
    });
  }, []);

  const openEditForm = useCallback((block: TimeBlock) => {
    setEditingBlock(block);
    setFormDay(block.startAt);
    setPrefilledStartMinutes(null);
    setIsFormVisible(true);
  }, []);

  const openEditFormById = useCallback(
    (blockId: string) => {
      const block = blocks.find((item) => item.id === blockId);
      if (block) {
        openEditForm(block);
      }
    },
    [blocks, openEditForm],
  );

  const closeForm = () => {
    setIsFormVisible(false);
    setEditingBlock(null);
    setPrefilledStartMinutes(null);
  };

  const handleSlotCreate = useCallback(
    async (
      weekStart: Date,
      dayIndex: number,
      startMinutes: number,
      endMinutes: number,
    ) => {
      const days = getWeekDays(weekStart);
      const day = days[dayIndex] ?? weekStart;
      const block = await createBlock({
        title: 'Neuer Termin',
        startAt: dateFromDayMinutes(day, startMinutes),
        endAt: dateFromDayMinutes(day, endMinutes),
        color: blockColorOptions[0],
      });
      openEditForm(block);
    },
    [createBlock, openEditForm],
  );

  const handleDayLongPress = useCallback(
    async (day: Date) => {
      const block = await createBlock({
        title: 'Neuer Termin',
        startAt: dateFromDayMinutes(day, DEFAULT_CREATE_MINUTES),
        endAt: dateFromDayMinutes(day, DEFAULT_CREATE_MINUTES + DEFAULT_CREATE_DURATION),
        color: blockColorOptions[0],
      });
      openEditForm(block);
    },
    [createBlock, openEditForm],
  );

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

  const renderWeekPage = useCallback(
    (weekOffset: -1 | 0 | 1) => {
      const weekStart = addDays(selectedWeekStart, weekOffset * 7);
      const days = getWeekDays(weekStart);
      const isCurrentPage = weekOffset === 0;

      return (
        <View style={styles.pageContent}>
          <WeekToolbar
            weekDays={days}
            onDayLongPress={isCurrentPage ? handleDayLongPress : undefined}
          />
          <WeekTimeline
            config={config}
            weekStart={weekStart}
            interactive={isCurrentPage}
            initialScrollY={scrollYRef.current}
            registerScrollRef={(node) => {
              scrollRefs.current[weekOffset] = node;
            }}
            onVerticalScroll={isCurrentPage ? syncScroll : undefined}
            onZoom={isCurrentPage ? setHourHeight : undefined}
            onSlotCreate={(dayIndex, startMinutes, endMinutes) => {
              void handleSlotCreate(weekStart, dayIndex, startMinutes, endMinutes);
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
        </View>
      );
    },
    [
      config,
      handleDayLongPress,
      handleSlotCreate,
      moveBlock,
      openEditFormById,
      resizeBlockEnd,
      resizeBlockStart,
      selectedWeekStart,
      setHourHeight,
      syncScroll,
    ],
  );

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
        <WeekPager
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          renderPage={renderWeekPage}
        />
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
  pageContent: {
    flex: 1,
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
