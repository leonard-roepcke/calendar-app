import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WeekViewScreen } from '../features/calendar/screens/WeekViewScreen';
import { CalendarProvider } from '../features/calendar/store/CalendarProvider';

export function CalendarApp() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <CalendarProvider>
          <WeekViewScreen />
          <StatusBar style="dark" />
        </CalendarProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
