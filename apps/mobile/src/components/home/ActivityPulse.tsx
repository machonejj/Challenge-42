import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@challenge42/config';
import type { HomePulseSummary, LiveActivityItem } from '@challenge42/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Pill } from '@/components/ui/Pill';
import { Divider } from '@/components/ui/Divider';
import { LiveActivityRow } from './LiveActivityRow';

function PulseStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="displayMd" style={{ color }}>
        {value}
      </Text>
      <Text variant="labelSm" color="tertiary" align="center">
        {label}
      </Text>
    </View>
  );
}

/** The Activity Pulse: honest, live "what's happening across the challenge right now". */
export function ActivityPulse({
  pulse,
  onCheer,
}: {
  pulse: HomePulseSummary;
  onCheer?: (item: LiveActivityItem) => void;
}): React.JSX.Element {
  return (
    <Card padded={false}>
      <View style={styles.header}>
        <Pill label="Live" tone="live" dot />
        <Text variant="labelMd" color="secondary">
          {pulse.activeCount} active now
        </Text>
      </View>

      <View style={styles.stats}>
        <PulseStat
          value={pulse.workingOutCount}
          label={'WORKING\nOUT'}
          color={colors.activity.workout}
        />
        <View style={styles.vline} />
        <PulseStat value={pulse.runningCount} label="RUNNING" color={colors.activity.running} />
        <View style={styles.vline} />
        <PulseStat value={pulse.walkingCount} label="WALKING" color={colors.activity.walking} />
      </View>

      <View style={styles.mealNote}>
        <Text variant="bodyMd" color="secondary">
          {pulse.plannedMealsLastHour} planned meals completed in the last hour
        </Text>
      </View>

      <Divider />

      <View style={styles.rows}>
        {pulse.liveActivity.map((item, i) => (
          <View key={item.id}>
            {i > 0 ? <Divider /> : null}
            <LiveActivityRow item={item} onCheer={onCheer} />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  vline: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: colors.border.hairline },
  mealNote: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  rows: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
});
