import type { TimeBlock, TimeBlockId } from '../../domain/models/timeBlock';

/** Erweiterungspunkt für Drag-and-Drop – aktuell No-Op. */
export interface DragDropAdapter {
  isEnabled: boolean;
  onDragStart?: (blockId: TimeBlockId) => void;
  onDragMove?: (blockId: TimeBlockId, deltaY: number) => void;
  onDragEnd?: (blockId: TimeBlockId) => void;
  onResizeStart?: (blockId: TimeBlockId, edge: 'start' | 'end') => void;
  onResizeMove?: (blockId: TimeBlockId, deltaY: number) => void;
  onResizeEnd?: (blockId: TimeBlockId) => void;
}

export const noopDragDropAdapter: DragDropAdapter = {
  isEnabled: false,
};

/** Erweiterungspunkt für Gesten (Swipe, Pinch, Long-Press). */
export interface GestureAdapter {
  onDaySwipe?: (direction: 'prev' | 'next') => void;
  onSlotLongPress?: (minutesFromMidnight: number) => void;
  onBlockPress?: (blockId: TimeBlockId) => void;
}

export interface CalendarInteractionHandlers extends GestureAdapter {
  dragDrop: DragDropAdapter;
}

export const defaultInteractionHandlers: CalendarInteractionHandlers = {
  dragDrop: noopDragDropAdapter,
};
