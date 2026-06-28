import type {
  CreateTimeBlockInput,
  TimeBlock,
  TimeBlockId,
  UpdateTimeBlockInput,
} from '../../domain/models/timeBlock';
import type { TimeBlockRepository } from '../../data/repositories/TimeBlockRepository';
import { validateTimeRange } from '../../shared/utils/layout';

export class TimeBlockService {
  constructor(private readonly repository: TimeBlockRepository) {}

  async listDay(day: Date): Promise<TimeBlock[]> {
    return this.repository.getByDay(day);
  }

  async listWeek(weekStart: Date): Promise<TimeBlock[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return this.repository.getByDateRange(weekStart, weekEnd);
  }

  async create(input: CreateTimeBlockInput): Promise<TimeBlock> {
    const error = validateTimeRange(input.startAt, input.endAt);
    if (error) {
      throw new Error(error);
    }
    if (!input.title.trim()) {
      throw new Error('Titel ist erforderlich.');
    }
    return this.repository.create(input);
  }

  async update(input: UpdateTimeBlockInput): Promise<TimeBlock> {
    const all = await this.repository.getAll();
    const current = all.find((block) => block.id === input.id);
    if (!current) {
      throw new Error('Time-Block nicht gefunden.');
    }

    const startAt = input.startAt ?? current.startAt;
    const endAt = input.endAt ?? current.endAt;
    const error = validateTimeRange(startAt, endAt);
    if (error) {
      throw new Error(error);
    }

    return this.repository.update(input);
  }

  async remove(id: TimeBlockId): Promise<void> {
    return this.repository.remove(id);
  }
}
