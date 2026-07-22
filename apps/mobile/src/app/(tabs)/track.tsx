import { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { buildDailySeries, kgToDisplay, round } from '@challenge42/domain';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { WeightJourneyChart } from '@/components/tracking/WeightJourneyChart';
import { useWeightSummary } from '@/features/tracking/useWeightSummary';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useProfileStore } from '@/features/profile/profileStore';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
}

const DELTA_COLOR = {
  down: colors.status.positive,
  up: colors.text.secondary,
  none: colors.text.tertiary,
} as const;

export default function TrackScreen(): React.JSX.Element {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const summary = useWeightSummary();
  const entries = useWeightStore((s) => s.entries);
  const profile = useProfileStore(
    useShallow((s) => ({
      startWeightKg: s.startWeightKg,
      unit: s.weightUnit,
      startDate: s.challengeStartDate,
      totalDays: s.challengeLengthDays,
      lossRange: s.recommendation?.weightLossRangeKg ?? null,
    })),
  );

  const chartWidth = width - layout.screenGutter * 2 - layout.cardPadding * 2;

  const series = useMemo(() => {
    if (profile.startWeightKg == null || !profile.startDate) return [];
    return buildDailySeries({
      startKg: profile.startWeightKg,
      startDateMs: new Date(profile.startDate).getTime(),
      totalDays: profile.totalDays,
      todayMs: Date.now(),
      points: entries.map((e) => ({ weightKg: e.weightKg, measuredAtMs: e.measuredAtMs })),
    });
  }, [entries, profile]);

  const targetKg =
    profile.startWeightKg != null && profile.lossRange
      ? profile.startWeightKg - (profile.lossRange.low + profile.lossRange.high) / 2
      : null;

  const openWeighIn = () => router.push('/weigh-in');

  return (
    <>
      <StatusBar style="dark" />
      <ScreenScaffold>
        <Text variant="labelSm" color="gold">
          TRACK
        </Text>
        <Text variant="titleLg" style={styles.title}>
          Your progress
        </Text>

        {summary.numbersHidden ? (
          <Card style={styles.softCard}>
            <Ionicons name="heart-outline" size={22} color={colors.status.positive} />
            <Text variant="titleMd" style={{ marginTop: spacing.md }}>
              We keep weight in the background
            </Text>
            <Text variant="bodyMd" color="secondary" style={{ marginTop: spacing.xs }}>
              You can log privately whenever you like — we won’t put a number front and center.
            </Text>
            <Button
              label="Log weight"
              variant="secondary"
              onPress={openWeighIn}
              style={styles.softBtn}
            />
          </Card>
        ) : !summary.hasData ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="trending-down-outline" size={24} color={colors.brand.pine} />
            </View>
            <Text variant="titleMd" align="center" style={{ marginTop: spacing.md }}>
              Weigh in to start your trend
            </Text>
            <Text variant="bodyMd" color="secondary" align="center" style={styles.emptyBody}>
              We track your 7-day trend, not the daily number — so a heavy day never counts against
              you.
            </Text>
            <Button label="Weigh in" onPress={openWeighIn} style={{ marginTop: spacing.xl }} />
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.xl }}>
            <Text variant="labelSm" color="tertiary">
              TREND WEIGHT
            </Text>
            <View style={styles.heroRow}>
              <Text variant="displayLg">{summary.trendDisplay}</Text>
              <Text variant="titleMd" color="tertiary" style={styles.unit}>
                {summary.unit}
              </Text>
            </View>
            {summary.delta.direction !== 'none' ? (
              <View style={styles.deltaRow}>
                <Ionicons
                  name={summary.delta.direction === 'down' ? 'arrow-down' : 'arrow-up'}
                  size={14}
                  color={DELTA_COLOR[summary.delta.direction]}
                />
                <Text variant="labelMd" style={{ color: DELTA_COLOR[summary.delta.direction] }}>
                  {summary.delta.value} {summary.unit} since start
                </Text>
              </View>
            ) : null}

            <View style={styles.chartWrap}>
              <WeightJourneyChart
                series={series}
                startKg={profile.startWeightKg ?? 0}
                targetKg={targetKg}
                totalDays={profile.totalDays}
                unit={summary.unit}
                width={chartWidth}
              />
            </View>

            <Text variant="labelSm" color="tertiary" style={styles.rawNote}>
              Latest reading: {summary.rawLatestDisplay} {summary.unit}
            </Text>
            <Button label="Weigh in" onPress={openWeighIn} style={{ marginTop: spacing.lg }} />

            {summary.recent.length > 0 ? (
              <View style={styles.history}>
                <Divider />
                {summary.recent.map((r) => (
                  <View key={r.id} style={styles.historyRow}>
                    <Text variant="bodyMd" color="secondary">
                      {shortDate(r.measuredAtMs)}
                    </Text>
                    <Text variant="labelMd">
                      {r.display} {summary.unit}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        )}

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          CALORIES
        </Text>
        <Card style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyLg">In-app food logging</Text>
            <Text variant="bodyMd" color="secondary">
              Quick-add calories + food search & barcode scanning.
            </Text>
          </View>
          <Text variant="labelSm" color="tertiary">
            Next
          </Text>
        </Card>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  softCard: { marginTop: spacing.xl },
  softBtn: { marginTop: spacing.xl, alignSelf: 'flex-start' },
  emptyCard: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing['2xl'] },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18, 56, 43, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBody: { marginTop: spacing.sm, maxWidth: 300 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.xs },
  unit: { marginBottom: 6 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  chartWrap: { marginTop: spacing.xl },
  rawNote: { marginTop: spacing.md },
  history: { marginTop: spacing.lg, gap: 0 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  sectionLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
