import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import {
  TIMELINE_HORIZONTAL_PADDING,
  TIME_GUTTER_WIDTH,
} from '../../../shared/utils/layout';
import {
  formatDayNumber,
  formatWeekdayShort,
  isDateInWeek,
  isSameDay,
  startOfDay,
} from '../../../shared/utils/dateTime';

interface WeekToolbarProps {
  weekDays: Date[];
  weekStart: Date;
  onToday: () => void;
}

export function WeekToolbar({ weekDays, weekStart, onToday }: WeekToolbarProps) {
  const today = startOfDay(new Date());
  const isCurrentWeek = isDateInWeek(new Date(), weekStart);

  return (
    <View style={styles.container}>
      <View style={styles.daysRow}>
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
      {!isCurrentWeek ? (
        <Pressable onPress={onToday} style={styles.todayLinkWrap}>
          <Text style={styles.todayLink}>Diese Woche</Text>
        </Pressable>
      ) : null}
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
  todayLinkWrap: {
    alignSelf: 'center',
    marginTop: 4,
  },
  todayLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});
