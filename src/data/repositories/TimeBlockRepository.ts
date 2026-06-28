import type {
  CreateTimeBlockInput,
  TimeBlock,
  TimeBlockId,
  UpdateTimeBlockInput,
} from '../../domain/models/timeBlock';

export interface TimeBlockRepository {
  getAll(): Promise<TimeBlock[]>;
  getByDay(day: Date): Promise<TimeBlock[]>;
  create(input: CreateTimeBlockInput): Promise<TimeBlock>;
  update(input: UpdateTimeBlockInput): Promise<TimeBlock>;
  remove(id: TimeBlockId): Promise<void>;
}
