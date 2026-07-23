import { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
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
import { useFoodLogStore, todayFoodTotals } from '@/features/tracking/foodLogStore';
import { formatThousands } from '@/lib/format';

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

const SLOT_LABEL = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
} as const;

export default function TrackScreen(): React.JSX.Element {
  const router = useRouter();
  const summary = useWeightSummary();
  const entries = useWeightStore((s) => s.entries);
  const profile = useProfileStore(
    useShallow((s) => ({
      startWeightKg: s.startWeightKg,
      unit: s.weightUnit,
      startDate: s.challengeStartDate,
      totalDays: s.challengeLengthDays,
      lossRange: s.recommendation?.weightLossRangeKg ?? null,
      calorieTarget: s.recommendation?.calorieTarget ?? null,
      proteinTarget: s.recommendation?.proteinTargetG ?? null,
    })),
  );

  const foodEntries = useFoodLogStore((s) => s.entries);
  const removeEntry = useFoodLogStore((s) => s.removeEntry);
  const totals = useMemo(() => todayFoodTotals(foodEntries, Date.now()), [foodEntries]);
  const calorieTarget = profile.calorieTarget;
  const calorieRemaining = calorieTarget != null ? calorieTarget - totals.calories : null;
  const calorieProgress = calorieTarget ? Math.min(totals.calories / calorieTarget, 1) : 0;

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
        <View style={styles.titleRow}>
          <Text variant="titleLg" style={styles.title}>
            Your progress
          </Text>
          <Pressable
            onPress={() => router.push('/calendar')}
            hitSlop={8}
            style={styles.historyBtn}
            accessibilityLabel="Open history calendar"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.brand.pine} />
            <Text variant="labelSm" style={{ color: colors.brand.pine }}>
              History
            </Text>
          </Pressable>
        </View>

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
          CALORIES · TODAY
        </Text>
        <Card>
          {calorieTarget != null ? (
            <>
              <View style={styles.calTop}>
                <View>
                  <Text variant="displayMd">{formatThousands(totals.calories)}</Text>
                  <Text variant="labelSm" color="tertiary">
                    of {formatThousands(calorieTarget)} kcal
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    variant="titleMd"
                    style={{
                      color:
                        (calorieRemaining ?? 0) >= 0
                          ? colors.status.positive
                          : colors.status.danger,
                    }}
                  >
                    {formatThousands(Math.abs(calorieRemaining ?? 0))}
                  </Text>
                  <Text variant="labelSm" color="tertiary">
                    {(calorieRemaining ?? 0) >= 0 ? 'remaining' : 'over'}
                  </Text>
                </View>
              </View>
              <View style={styles.calTrack}>
                <View style={[styles.calFill, { width: `${calorieProgress * 100}%` }]} />
              </View>
              {profile.proteinTarget != null ? (
                <Text variant="labelMd" color="secondary" style={{ marginTop: spacing.md }}>
                  Protein {totals.proteinG} / {profile.proteinTarget}g
                </Text>
              ) : null}
            </>
          ) : (
            <Text variant="bodyMd" color="secondary">
              Your plan focuses on consistency, not a calorie number. Log what you like — no
              pressure.
            </Text>
          )}

          {totals.calories > 0 ? (
            <View style={styles.foodList}>
              <Divider />
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((s) => {
                const group = totals.bySlot[s];
                if (group.items.length === 0) return null;
                return (
                  <View key={s} style={styles.slotGroup}>
                    <Text variant="labelSm" color="tertiary">
                      {SLOT_LABEL[s]} · {group.calories} cal
                    </Text>
                    {group.items.map((it) => (
                      <View key={it.id} style={styles.foodItem}>
                        <Pressable
                          style={styles.foodItemMain}
                          onPress={() => router.push(`/edit-food?id=${it.id}`)}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${it.label}`}
                        >
                          <Text variant="bodyMd" style={{ flex: 1 }} numberOfLines={1}>
                            {it.label}
                          </Text>
                          <Text variant="labelMd" color="secondary">
                            {it.calories} cal
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => removeEntry(it.id)}
                          hitSlop={8}
                          style={styles.foodDelete}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${it.label}`}
                        >
                          <Ionicons name="close" size={16} color={colors.text.tertiary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text variant="bodyMd" color="tertiary" style={{ marginTop: spacing.md }}>
              Nothing logged yet today.
            </Text>
          )}

          <Button
            label="Log food"
            onPress={() => router.push('/log-food')}
            style={{ marginTop: spacing.lg }}
          />
        </Card>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
  },
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
  calTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  calTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  calFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.status.positive },
  foodList: { marginTop: spacing.lg },
  slotGroup: { marginTop: spacing.md, gap: 2 },
  foodItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  foodItemMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  foodDelete: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.sunken,
  },
});
