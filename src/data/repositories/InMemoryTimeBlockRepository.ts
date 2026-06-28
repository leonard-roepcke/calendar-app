import type {
  CreateTimeBlockInput,
  TimeBlock,
  TimeBlockId,
  UpdateTimeBlockInput,
} from '../../domain/models/timeBlock';
import { isSameDay, startOfDay } from '../../shared/utils/dateTime';
import type { TimeBlockRepository } from './TimeBlockRepository';

function createId(): TimeBlockId {
  return `tb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class InMemoryTimeBlockRepository implements TimeBlockRepository {
  private blocks: TimeBlock[] = [];

  constructor(seed: TimeBlock[] = []) {
    this.blocks = [...seed];
  }

  async getAll(): Promise<TimeBlock[]> {
    return [...this.blocks].sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime(),
    );
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
    const block: TimeBlock = {
      id: createId(),
      title: input.title.trim(),
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      color: input.color,
      notes: input.notes,
    };
    this.blocks.push(block);
    return block;
  }

  async update(input: UpdateTimeBlockInput): Promise<TimeBlock> {
    const index = this.blocks.findIndex((block) => block.id === input.id);
    if (index === -1) {
      throw new Error(`Time-Block ${input.id} nicht gefunden.`);
    }

    const current = this.blocks[index];
    const updated: TimeBlock = {
      ...current,
      title: input.title?.trim() ?? current.title,
      startAt: input.startAt ? new Date(input.startAt) : current.startAt,
      endAt: input.endAt ? new Date(input.endAt) : current.endAt,
      color: input.color ?? current.color,
      notes: input.notes ?? current.notes,
    };
    this.blocks[index] = updated;
    return updated;
  }

  async remove(id: TimeBlockId): Promise<void> {
    this.blocks = this.blocks.filter((block) => block.id !== id);
  }
}
