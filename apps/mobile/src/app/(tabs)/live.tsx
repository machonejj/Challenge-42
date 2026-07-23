import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { LiveDot } from '@/components/ui/LiveDot';
import { USPresenceMap } from '@/components/live/USPresenceMap';
import { Leaderboard } from '@/components/live/Leaderboard';
import { useCommunity, type LeaderMetric } from '@/features/live/community';

type IconName = keyof typeof Ionicons.glyphMap;

const METRICS: { key: LeaderMetric; label: string; icon: IconName }[] = [
  { key: 'lbs', label: 'Weight', icon: 'trending-down' },
  { key: 'steps', label: 'Steps', icon: 'footsteps' },
  { key: 'workouts', label: 'Workouts', icon: 'barbell' },
];
const TITLE: Record<LeaderMetric, string> = {
  lbs: 'Most pounds lost',
  steps: 'Today’s step leaders',
  workouts: 'Today’s workout leaders',
};
const SUB: Record<LeaderMetric, string> = {
  lbs: 'Total pounds lost this challenge.',
  steps: 'Steps logged today.',
  workouts: 'Active minutes logged today.',
};

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <View style={styles.legendItem}>
      {swatch}
      <Text variant="labelSm" color="secondary">
        {label}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen(): React.JSX.Element {
  const { rows, dots, onlineCount, totalCount } = useCommunity();
  const [metric, setMetric] = useState<LeaderMetric>('lbs');

  return (
    <>
      <StatusBar style="dark" />
      <ScreenScaffold>
        <Text variant="labelSm" color="gold">
          LEADERBOARD
        </Text>
        <Text variant="titleLg" style={styles.title}>
          {TITLE[metric]}
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          {SUB[metric]}
        </Text>

        <View style={styles.filter}>
          {METRICS.map((m) => {
            const on = metric === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMetric(m.key)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Ionicons
                  name={m.icon}
                  size={15}
                  color={on ? colors.text.onPine : colors.text.secondary}
                />
                <Text
                  variant="labelSm"
                  style={{ color: on ? colors.text.onPine : colors.text.secondary }}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.board}>
          <Leaderboard rows={rows} metric={metric} />
        </View>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          WHERE CHALLENGERS ARE
        </Text>
        <Card>
          <Text variant="bodyMd" color="secondary" style={styles.mapCaption}>
            {totalCount === 0
              ? 'Enroll and weigh in to appear on the map.'
              : `${onlineCount} of ${totalCount} active today · state-level only.`}
          </Text>
          <View style={styles.mapWrap}>
            <USPresenceMap dots={dots} />
          </View>
          <View style={styles.legend}>
            <LegendItem swatch={<LiveDot size={9} />} label="Active today" />
            <LegendItem swatch={<View style={styles.offlineSwatch} />} label="Resting" />
          </View>
        </Card>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  subtitle: { marginTop: spacing.sm },
  filter: {
    flexDirection: 'row',
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
    marginTop: spacing.lg,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  chipOn: { backgroundColor: colors.brand.pine },
  board: { marginTop: spacing.xl },
  sectionLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  mapCaption: { marginBottom: spacing.md },
  mapWrap: { alignItems: 'center' },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  offlineSwatch: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.text.tertiary,
  },
});
