import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { formatDayLabel, isSameDay, startOfDay } from '../../../shared/utils/dateTime';

interface DayHeaderProps {
  selectedDay: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function DayHeader({
  selectedDay,
  onPrevious,
  onNext,
  onToday,
}: DayHeaderProps) {
  const isToday = isSameDay(selectedDay, startOfDay(new Date()));

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <Pressable onPress={onPrevious} style={styles.navButton} hitSlop={8}>
          <Text style={styles.navLabel}>‹</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{formatDayLabel(selectedDay)}</Text>
          {!isToday ? (
            <Pressable onPress={onToday}>
              <Text style={styles.todayLink}>Heute</Text>
            </Pressable>
          ) : (
            <Text style={styles.todayBadge}>Heute</Text>
          )}
        </View>
        <Pressable onPress={onNext} style={styles.navButton} hitSlop={8}>
          <Text style={styles.navLabel}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  navLabel: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  todayLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  todayBadge: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
