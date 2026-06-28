export type TimeBlockId = string;

export interface TimeBlock {
  id: TimeBlockId;
  title: string;
  startAt: Date;
  endAt: Date;
  color?: string;
  notes?: string;
}

export interface CreateTimeBlockInput {
  title: string;
  startAt: Date;
  endAt: Date;
  color?: string;
  notes?: string;
}

export interface UpdateTimeBlockInput {
  id: TimeBlockId;
  title?: string;
  startAt?: Date;
  endAt?: Date;
  color?: string;
  notes?: string;
}

export interface TimeRange {
  startAt: Date;
  endAt: Date;
}
