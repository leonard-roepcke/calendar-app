import { StyleSheet, Text, View } from 'react-native';
import type { CalendarConfig } from '../../../domain/models/calendarConfig';
import { colors } from '../../../shared/theme/colors';
import { getTimelineMetrics, TIME_GUTTER_WIDTH } from '../../../shared/utils/layout';

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
      <View style={[styles.line, styles.endLine]} />
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
      <View style={styles.endLabelRow}>
        <Text style={styles.endTimeLabel}>
          {`${config.dayEndHour.toString().padStart(2, '0')}:00`}
        </Text>
      </View>
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
  endLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  timeColumn: {
    width: TIME_GUTTER_WIDTH,
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
  endLabelRow: {
    position: 'absolute',
    left: 0,
    right: 8,
    bottom: 0,
  },
  endTimeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: -6,
  },
});
