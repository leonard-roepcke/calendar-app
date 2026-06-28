export interface CalendarConfig {
  dayStartHour: number;
  dayEndHour: number;
  hourHeight: number;
  snapMinutes: number;
}

export const DEFAULT_CALENDAR_CONFIG: CalendarConfig = {
  dayStartHour: 0,
  dayEndHour: 24,
  hourHeight: 56,
  snapMinutes: 15,
};
