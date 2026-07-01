import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import {
  TIMELINE_HORIZONTAL_PADDING,
  TIME_GUTTER_WIDTH,
} from '../../../shared/utils/layout';
import {
  formatDayNumber,
  formatWeekdayShort,
  isSameDay,
  startOfDay,
} from '../../../shared/utils/dateTime';

interface WeekToolbarProps {
  weekDays: Date[];
  onDayLongPress?: (day: Date, dayIndex: number) => void;
}

export function WeekToolbar({ weekDays, onDayLongPress }: WeekToolbarProps) {
  const today = startOfDay(new Date());

  return (
    <View style={styles.container}>
      <View style={styles.daysRow}>
        <View style={styles.timeGutter} />
        {weekDays.map((day, dayIndex) => {
          const isToday = isSameDay(day, today);
          return (
            <Pressable
              key={day.toISOString()}
              style={styles.column}
              delayLongPress={500}
              onLongPress={
                onDayLongPress ? () => onDayLongPress(day, dayIndex) : undefined
              }
              accessibilityRole="button"
              accessibilityLabel={`${formatWeekdayShort(day)} ${formatDayNumber(day)}`}
            >
              <Text style={[styles.weekday, isToday && styles.todayText]}>
                {formatWeekdayShort(day)}
              </Text>
              <View style={[styles.dayBadge, isToday && styles.todayBadge]}>
                <Text style={[styles.dayNumber, isToday && styles.todayDayNumber]}>
                  {formatDayNumber(day)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: TIMELINE_HORIZONTAL_PADDING,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeGutter: {
    width: TIME_GUTTER_WIDTH,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  weekday: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  todayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  dayBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  todayDayNumber: {
    color: colors.textInverse,
  },
});
