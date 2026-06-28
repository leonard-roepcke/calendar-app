export interface CalendarConfig {
  dayStartHour: number;
  dayEndHour: number;
  hourHeight: number;
  snapMinutes: number;
}

export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  dayStartHour: 6,
  dayEndHour: 22,
  hourHeight: 64,
  snapMinutes: 15,
};
