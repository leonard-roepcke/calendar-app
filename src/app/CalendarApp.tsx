import { StatusBar } from 'expo-status-bar';
import { CalendarProvider } from '../features/calendar/store/CalendarProvider';
import { DayViewScreen } from '../features/calendar/screens/DayViewScreen';

export function CalendarApp() {
  return (
    <CalendarProvider>
      <DayViewScreen />
      <StatusBar style="dark" />
    </CalendarProvider>
  );
}
