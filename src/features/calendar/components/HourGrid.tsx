import { StyleSheet, Text, View } from 'react-native';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import { colors } from '../../../shared/theme/colors';
import { getTimelineMetrics } from '../../../shared/utils/layout';

interface HourGridProps {
  config: CalendarConfig;
}

export function HourGrid({ config }: HourGridProps) {
  const metrics = getTimelineMetrics(config);
  const hours = Array.from(
    { length: config.dayEndHour - config.dayStartHour },
    (_, index) => config.dayStartHour + index,
  );

  return (
    <View style={[styles.container, { height: metrics.totalHeight }]}>
      {hours.map((hour) => (
        <View
          key={hour}
          style={[styles.hourRow, { height: config.hourHeight }]}
        >
          <View style={styles.line} />
        </View>
      ))}
    </View>
  );
}

interface TimeColumnProps {
  config: CalendarConfig;
}

export function TimeColumn({ config }: TimeColumnProps) {
  const metrics = getTimelineMetrics(config);
  const hours = Array.from(
    { length: config.dayEndHour - config.dayStartHour },
    (_, index) => config.dayStartHour + index,
  );

  return (
    <View style={[styles.timeColumn, { height: metrics.totalHeight }]}>
      {hours.map((hour) => (
        <View
          key={hour}
          style={[styles.timeLabelRow, { height: config.hourHeight }]}
        >
          <Text style={styles.timeLabel}>
            {`${hour.toString().padStart(2, '0')}:00`}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  hourRow: {
    justifyContent: 'flex-start',
  },
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gridLine,
  },
  timeColumn: {
    width: 52,
    paddingRight: 8,
  },
  timeLabelRow: {
    justifyContent: 'flex-start',
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: -6,
  },
});
