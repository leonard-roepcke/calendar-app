import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { InMemoryTimeBlockRepository } from '../../../data/repositories/InMemoryTimeBlockRepository';
import { createSampleTimeBlocks } from '../../../data/seed/sampleTimeBlocks';
import { DEFAULT_CALENDAR_CONFIG } from '../../../domain/models/calendarConfig';
import { TimeBlockService } from '../../../domain/services/TimeBlockService';
import type {
  CreateTimeBlockInput,
  TimeBlock,
  TimeBlockId,
  UpdateTimeBlockInput,
} from '../../../domain/models/timeBlock';
import { computeBlockMove, computeBlockResizeEnd, computeBlockResizeStart } from '../../../shared/utils/layout';
import {
  addDays,
  getWeekDays,
  isDateInWeek,
  startOfDay,
  startOfWeek,
} from '../../../shared/utils/dateTime';

interface CalendarState {
  selectedWeekStart: Date;
  blocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
}

type CalendarAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_BLOCKS'; blocks: TimeBlock[] }
  | { type: 'SET_WEEK_START'; weekStart: Date }
  | { type: 'ADD_BLOCK'; block: TimeBlock }
  | { type: 'UPDATE_BLOCK'; block: TimeBlock }
  | { type: 'REMOVE_BLOCK'; id: TimeBlockId };

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_BLOCKS':
      return { ...state, blocks: action.blocks };
    case 'SET_WEEK_START':
      return { ...state, selectedWeekStart: action.weekStart, error: null };
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map((block) =>
          block.id === action.block.id ? action.block : block,
        ),
      };
    case 'REMOVE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.filter((block) => block.id !== action.id),
      };
    default:
      return state;
  }
}

interface CalendarContextValue {
  config: typeof DEFAULT_CALENDAR_CONFIG;
  selectedWeekStart: Date;
  weekDays: Date[];
  blocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToToday: () => void;
  refreshWeek: () => Promise<void>;
  createBlock: (input: CreateTimeBlockInput) => Promise<TimeBlock>;
  updateBlock: (input: UpdateTimeBlockInput) => Promise<void>;
  removeBlock: (id: TimeBlockId) => Promise<void>;
  moveBlock: (id: TimeBlockId, deltaDays: number, deltaMinutes: number) => Promise<void>;
  resizeBlockStart: (
    id: TimeBlockId,
    deltaDays: number,
    deltaMinutes: number,
  ) => Promise<void>;
  resizeBlockEnd: (
    id: TimeBlockId,
    deltaDays: number,
    deltaMinutes: number,
  ) => Promise<void>;
  clearError: () => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

const repository = new InMemoryTimeBlockRepository(createSampleTimeBlocks());
const timeBlockService = new TimeBlockService(repository);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, {
    selectedWeekStart: startOfWeek(new Date()),
    blocks: [],
    isLoading: true,
    error: null,
  });

  const weekDays = useMemo(
    () => getWeekDays(state.selectedWeekStart),
    [state.selectedWeekStart],
  );

  const refreshWeek = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const blocks = await timeBlockService.listWeek(state.selectedWeekStart);
      dispatch({ type: 'SET_BLOCKS', blocks });
      dispatch({ type: 'SET_ERROR', error: null });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [state.selectedWeekStart]);

  useEffect(() => {
    void refreshWeek();
  }, [refreshWeek]);

  const goToPreviousWeek = useCallback(() => {
    dispatch({
      type: 'SET_WEEK_START',
      weekStart: addDays(state.selectedWeekStart, -7),
    });
  }, [state.selectedWeekStart]);

  const goToNextWeek = useCallback(() => {
    dispatch({
      type: 'SET_WEEK_START',
      weekStart: addDays(state.selectedWeekStart, 7),
    });
  }, [state.selectedWeekStart]);

  const goToToday = useCallback(() => {
    dispatch({ type: 'SET_WEEK_START', weekStart: startOfWeek(new Date()) });
  }, []);

  const createBlock = useCallback(
    async (input: CreateTimeBlockInput): Promise<TimeBlock> => {
      try {
        const block = await timeBlockService.create(input);
        if (isDateInWeek(block.startAt, state.selectedWeekStart)) {
          dispatch({ type: 'ADD_BLOCK', block });
        }
        dispatch({ type: 'SET_ERROR', error: null });
        return block;
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          error: error instanceof Error ? error.message : 'Speichern fehlgeschlagen',
        });
        throw error;
      }
    },
    [state.selectedWeekStart],
  );

  const updateBlock = useCallback(
    async (input: UpdateTimeBlockInput) => {
      try {
        const block = await timeBlockService.update(input);
        if (isDateInWeek(block.startAt, state.selectedWeekStart)) {
          dispatch({ type: 'UPDATE_BLOCK', block });
        } else {
          dispatch({ type: 'REMOVE_BLOCK', id: block.id });
        }
        dispatch({ type: 'SET_ERROR', error: null });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          error: error instanceof Error ? error.message : 'Aktualisieren fehlgeschlagen',
        });
        throw error;
      }
    },
    [state.selectedWeekStart],
  );

  const removeBlock = useCallback(async (id: TimeBlockId) => {
    await timeBlockService.remove(id);
    dispatch({ type: 'REMOVE_BLOCK', id });
  }, []);

  const moveBlock = useCallback(
    async (id: TimeBlockId, deltaDays: number, deltaMinutes: number) => {
      const block = state.blocks.find((item) => item.id === id);
      if (!block) {
        return;
      }

      const times = computeBlockMove(
        block,
        state.selectedWeekStart,
        deltaDays,
        deltaMinutes,
        DEFAULT_CALENDAR_CONFIG,
      );
      if (!times) {
        return;
      }

      await updateBlock({
        id,
        startAt: times.startAt,
        endAt: times.endAt,
      });
    },
    [state.blocks, state.selectedWeekStart, updateBlock],
  );

  const resizeBlockStart = useCallback(
    async (id: TimeBlockId, deltaDays: number, deltaMinutes: number) => {
      const block = state.blocks.find((item) => item.id === id);
      if (!block) {
        return;
      }

      const times = computeBlockResizeStart(
        block,
        state.selectedWeekStart,
        deltaDays,
        deltaMinutes,
        DEFAULT_CALENDAR_CONFIG,
      );
      if (!times) {
        return;
      }

      await updateBlock({
        id,
        startAt: times.startAt,
        endAt: times.endAt,
      });
    },
    [state.blocks, state.selectedWeekStart, updateBlock],
  );

  const resizeBlockEnd = useCallback(
    async (id: TimeBlockId, deltaDays: number, deltaMinutes: number) => {
      const block = state.blocks.find((item) => item.id === id);
      if (!block) {
        return;
      }

      const times = computeBlockResizeEnd(
        block,
        state.selectedWeekStart,
        deltaDays,
        deltaMinutes,
        DEFAULT_CALENDAR_CONFIG,
      );
      if (!times) {
        return;
      }

      await updateBlock({
        id,
        startAt: times.startAt,
        endAt: times.endAt,
      });
    },
    [state.blocks, state.selectedWeekStart, updateBlock],
  );

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const value = useMemo<CalendarContextValue>(
    () => ({
      config: DEFAULT_CALENDAR_CONFIG,
      selectedWeekStart: state.selectedWeekStart,
      weekDays,
      blocks: state.blocks,
      isLoading: state.isLoading,
      error: state.error,
      goToPreviousWeek,
      goToNextWeek,
      goToToday,
      refreshWeek,
      createBlock,
      updateBlock,
      removeBlock,
      moveBlock,
      resizeBlockStart,
      resizeBlockEnd,
      clearError,
    }),
    [
      state.selectedWeekStart,
      state.blocks,
      state.isLoading,
      state.error,
      weekDays,
      goToPreviousWeek,
      goToNextWeek,
      goToToday,
      refreshWeek,
      createBlock,
      updateBlock,
      removeBlock,
      moveBlock,
      resizeBlockStart,
      resizeBlockEnd,
      clearError,
    ],
  );

  return (
    <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
  );
}

export function useCalendar(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar muss innerhalb von CalendarProvider verwendet werden.');
  }
  return context;
}
