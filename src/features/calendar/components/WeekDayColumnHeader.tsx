import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import {
  formatDayNumber,
  formatWeekdayShort,
  isSameDay,
  startOfDay,
} from '../../../shared/utils/dateTime';

interface WeekDayColumnHeaderProps {
  weekDays: Date[];
}

export function WeekDayColumnHeader({ weekDays }: WeekDayColumnHeaderProps) {
  const today = startOfDay(new Date());

  return (
    <View style={styles.row}>
      <View style={styles.timeGutter} />
      {weekDays.map((day) => {
        const isToday = isSameDay(day, today);
        return (
          <View key={day.toISOString()} style={styles.column}>
            <Text style={[styles.weekday, isToday && styles.todayText]}>
              {formatWeekdayShort(day)}
            </Text>
            <View style={[styles.dayBadge, isToday && styles.todayBadge]}>
              <Text style={[styles.dayNumber, isToday && styles.todayDayNumber]}>
                {formatDayNumber(day)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  timeGutter: {
    width: 52,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weekday: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  todayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  dayBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  todayDayNumber: {
    color: colors.textInverse,
  },
});
