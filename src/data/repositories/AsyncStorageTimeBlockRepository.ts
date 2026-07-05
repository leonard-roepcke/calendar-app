import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CreateTimeBlockInput,
  TimeBlock,
  TimeBlockId,
  UpdateTimeBlockInput,
} from '../../domain/models/timeBlock';
import { isSameDay, startOfDay } from '../../shared/utils/dateTime';
import type { TimeBlockRepository } from './TimeBlockRepository';

const STORAGE_KEY = 'calendar-app:time-blocks:v1';

interface StoredTimeBlock {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  color?: string;
  notes?: string;
}

function createId(): TimeBlockId {
  return `tb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function cloneBlock(block: TimeBlock): TimeBlock {
  return {
    ...block,
    startAt: new Date(block.startAt),
    endAt: new Date(block.endAt),
  };
}

function serializeBlock(block: TimeBlock): StoredTimeBlock {
  return {
    id: block.id,
    title: block.title,
    startAt: block.startAt.toISOString(),
    endAt: block.endAt.toISOString(),
    color: block.color,
    notes: block.notes,
  };
}

function deserializeBlock(block: StoredTimeBlock): TimeBlock {
  const startAt = new Date(block.startAt);
  const endAt = new Date(block.endAt);

  if (
    typeof block.id !== 'string' ||
    typeof block.title !== 'string' ||
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime())
  ) {
    throw new Error('Stored time block is invalid.');
  }

  return {
    id: block.id,
    title: block.title,
    startAt,
    endAt,
    color: typeof block.color === 'string' ? block.color : undefined,
    notes: typeof block.notes === 'string' ? block.notes : undefined,
  };
}

export class AsyncStorageTimeBlockRepository implements TimeBlockRepository {
  private blocks: TimeBlock[] | null = null;
  private operationQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly seed: TimeBlock[] = []) {}

  async getAll(): Promise<TimeBlock[]> {
    await this.operationQueue.catch(() => undefined);
    const blocks = await this.ensureLoaded();
    return [...blocks]
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
      .map(cloneBlock);
  }

  async getByDay(day: Date): Promise<TimeBlock[]> {
    const all = await this.getAll();
    return all.filter((block) => isSameDay(block.startAt, day));
  }

  async getByDateRange(start: Date, end: Date): Promise<TimeBlock[]> {
    const rangeStart = startOfDay(start).getTime();
    const rangeEnd = startOfDay(end).getTime();
    const all = await this.getAll();
    return all.filter((block) => {
      const blockDay = startOfDay(block.startAt).getTime();
      return blockDay >= rangeStart && blockDay < rangeEnd;
    });
  }

  async create(input: CreateTimeBlockInput): Promise<TimeBlock> {
    return this.enqueue(async () => {
      const blocks = await this.ensureLoaded();
      const block: TimeBlock = {
        id: createId(),
        title: input.title.trim(),
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        color: input.color,
        notes: input.notes,
      };
      blocks.push(block);
      await this.persist(blocks);
      return cloneBlock(block);
    });
  }

  async update(input: UpdateTimeBlockInput): Promise<TimeBlock> {
    return this.enqueue(async () => {
      const blocks = await this.ensureLoaded();
      const index = blocks.findIndex((block) => block.id === input.id);
      if (index === -1) {
        throw new Error(`Time-Block ${input.id} nicht gefunden.`);
      }

      const current = blocks[index];
      const updated: TimeBlock = {
        ...current,
        title: input.title?.trim() ?? current.title,
        startAt: input.startAt ? new Date(input.startAt) : current.startAt,
        endAt: input.endAt ? new Date(input.endAt) : current.endAt,
        color: input.color ?? current.color,
        notes: input.notes ?? current.notes,
      };
      blocks[index] = updated;
      await this.persist(blocks);
      return cloneBlock(updated);
    });
  }

  async remove(id: TimeBlockId): Promise<void> {
    return this.enqueue(async () => {
      const blocks = await this.ensureLoaded();
      const nextBlocks = blocks.filter((block) => block.id !== id);
      this.blocks = nextBlocks;
      await this.persist(nextBlocks);
    });
  }

  private async ensureLoaded(): Promise<TimeBlock[]> {
    if (this.blocks) {
      return this.blocks;
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      this.blocks = this.seed.map(cloneBlock);
      await this.persist(this.blocks);
      return this.blocks;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('Stored time blocks must be an array.');
      }
      this.blocks = parsed.map((item) => deserializeBlock(item as StoredTimeBlock));
      return this.blocks;
    } catch {
      throw new Error('Gespeicherte Termine konnten nicht geladen werden.');
    }
  }

  private async persist(blocks: TimeBlock[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(blocks.map(serializeBlock)),
    );
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.operationQueue.then(operation, operation);
    this.operationQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}
