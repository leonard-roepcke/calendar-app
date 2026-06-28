import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
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
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekToolbar({
  weekDays,
  weekStart,
  onPrevious,
  onNext,
  onToday,
}: WeekToolbarProps) {
  const today = startOfDay(new Date());
  const isCurrentWeek = isDateInWeek(new Date(), weekStart);

  return (
    <View style={styles.container}>
      <Pressable onPress={onPrevious} style={styles.navButton} hitSlop={8}>
        <Text style={styles.navLabel}>‹</Text>
      </Pressable>

      <View style={styles.center}>
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

      <Pressable onPress={onNext} style={styles.navButton} hitSlop={8}>
        <Text style={styles.navLabel}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    gap: 2,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  navLabel: {
    fontSize: 22,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
