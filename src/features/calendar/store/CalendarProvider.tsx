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
import { addDays, startOfDay } from '../../../shared/utils/dateTime';

interface CalendarState {
  selectedDay: Date;
  blocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
}

type CalendarAction =
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_BLOCKS'; blocks: TimeBlock[] }
  | { type: 'SET_SELECTED_DAY'; day: Date }
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
    case 'SET_SELECTED_DAY':
      return { ...state, selectedDay: action.day, error: null };
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
  selectedDay: Date;
  blocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  refreshDay: () => Promise<void>;
  createBlock: (input: CreateTimeBlockInput) => Promise<void>;
  updateBlock: (input: UpdateTimeBlockInput) => Promise<void>;
  removeBlock: (id: TimeBlockId) => Promise<void>;
  clearError: () => void;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

const repository = new InMemoryTimeBlockRepository(createSampleTimeBlocks());
const timeBlockService = new TimeBlockService(repository);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, {
    selectedDay: startOfDay(new Date()),
    blocks: [],
    isLoading: true,
    error: null,
  });

  const refreshDay = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    try {
      const blocks = await timeBlockService.listDay(state.selectedDay);
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
  }, [state.selectedDay]);

  useEffect(() => {
    void refreshDay();
  }, [refreshDay]);

  const goToPreviousDay = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_DAY', day: addDays(state.selectedDay, -1) });
  }, [state.selectedDay]);

  const goToNextDay = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_DAY', day: addDays(state.selectedDay, 1) });
  }, [state.selectedDay]);

  const goToToday = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_DAY', day: startOfDay(new Date()) });
  }, []);

  const createBlock = useCallback(
    async (input: CreateTimeBlockInput) => {
      try {
        const block = await timeBlockService.create(input);
        if (block.startAt.toDateString() === state.selectedDay.toDateString()) {
          dispatch({ type: 'ADD_BLOCK', block });
        }
        dispatch({ type: 'SET_ERROR', error: null });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          error: error instanceof Error ? error.message : 'Speichern fehlgeschlagen',
        });
        throw error;
      }
    },
    [state.selectedDay],
  );

  const updateBlock = useCallback(async (input: UpdateTimeBlockInput) => {
    try {
      const block = await timeBlockService.update(input);
      dispatch({ type: 'UPDATE_BLOCK', block });
      dispatch({ type: 'SET_ERROR', error: null });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'Aktualisieren fehlgeschlagen',
      });
      throw error;
    }
  }, []);

  const removeBlock = useCallback(async (id: TimeBlockId) => {
    await timeBlockService.remove(id);
    dispatch({ type: 'REMOVE_BLOCK', id });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', error: null });
  }, []);

  const value = useMemo<CalendarContextValue>(
    () => ({
      config: DEFAULT_CALENDAR_CONFIG,
      selectedDay: state.selectedDay,
      blocks: state.blocks,
      isLoading: state.isLoading,
      error: state.error,
      goToPreviousDay,
      goToNextDay,
      goToToday,
      refreshDay,
      createBlock,
      updateBlock,
      removeBlock,
      clearError,
    }),
    [
      state,
      goToPreviousDay,
      goToNextDay,
      goToToday,
      refreshDay,
      createBlock,
      updateBlock,
      removeBlock,
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
