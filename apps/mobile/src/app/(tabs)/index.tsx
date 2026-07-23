import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import type { HomeSnapshot } from '@challenge42/types';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { StatePlaceholder } from '@/components/ui/StatePlaceholder';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ChallengeHeader } from '@/components/home/ChallengeHeader';
import { MetricCard } from '@/components/home/MetricCard';
import { QuickAction } from '@/components/home/QuickAction';
import { WeighInStatus } from '@/components/home/WeighInStatus';
import { GoalsProgress } from '@/components/home/GoalsProgress';
import { ChallengeDateBanner } from '@/components/home/ChallengeDateBanner';
import { CommunityCounters } from '@/components/community/CommunityCounters';
import { usePersonalizedHome } from '@/features/home/usePersonalizedHome';
import { useProfileStore } from '@/features/profile/profileStore';
import { useChallengeStore } from '@/features/challenge/challengeStore';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useStepsStore, todaySteps } from '@/features/tracking/stepsStore';
import { useActivityStore } from '@/features/activity/activityStore';
import { useGoalsStore } from '@/features/goals/goalsStore';
import { getAnalytics } from '@/services/analytics/AnalyticsService';
import { formatThousands } from '@/lib/format';

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function weighInStreak(entries: readonly { measuredAtMs: number }[]): number {
  const days = new Set(entries.map((e) => dayKey(e.measuredAtMs)));
  const c = new Date();
  c.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(c.getTime()))) c.setDate(c.getDate() - 1); // today not logged yet → count back
  let streak = 0;
  while (days.has(dayKey(c.getTime()))) {
    streak += 1;
    c.setDate(c.getDate() - 1);
  }
  return streak;
}

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = usePersonalizedHome();
  const safeReview = useProfileStore((s) => s.safetyStatus === 'SAFE_REVIEW_REQUIRED');

  const weightEntries = useWeightStore((s) => s.entries);
  const stepsToday = useStepsStore((s) => todaySteps(s.entries, Date.now()));
  const activitySessions = useActivityStore((s) => s.sessions);
  const stepsGoal = useGoalsStore((s) => s.stepsGoal);
  const activityGoal = useGoalsStore((s) => s.activityMinutesGoal);
  const calorieGoal = useGoalsStore((s) => s.calorieGoal);
  const challengeStart = useChallengeStore((s) => s.startDate);
  const challengeLength = useChallengeStore((s) => s.lengthDays);
  const profileStart = useProfileStore((s) => s.challengeStartDate);
  const effectiveStart = challengeStart ?? (profileStart ? profileStart.slice(0, 10) : null);

  const weighedToday = useMemo(
    () => weightEntries.some((e) => dayKey(e.measuredAtMs) === dayKey(Date.now())),
    [weightEntries],
  );
  const streak = useMemo(() => weighInStreak(weightEntries), [weightEntries]);
  const activityToday = useMemo(() => {
    const start = startOfToday();
    return activitySessions
      .filter((s) => s.completedAtMs >= start)
      .reduce((sum, s) => sum + s.durationMin, 0);
  }, [activitySessions]);

  useEffect(() => {
    if (data) getAnalytics().track('HOME_VIEWED', { dayNumber: data.challenge.dayNumber });
  }, [data]);

  if (isLoading || !data) {
    return (
      <>
        <StatusBar style="dark" />
        <ScreenScaffold scroll={false} center>
          <StatePlaceholder kind="loading" title="Loading your challenge…" />
        </ScreenScaffold>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <StatusBar style="dark" />
        <ScreenScaffold scroll={false} center>
          <StatePlaceholder
            kind="error"
            title="Couldn't load your day"
            message="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        </ScreenScaffold>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <ScreenScaffold bleedTop padded={false} refreshing={isRefetching} onRefresh={() => refetch()}>
        <ChallengeHeader
          challengeName={data.challenge.name}
          dayNumber={data.challenge.dayNumber}
          totalDays={data.challenge.totalDays}
          streakDays={data.streakDays}
          greetingName={data.greetingName}
          onPressAvatar={() => router.push('/profile')}
        />

        <View style={styles.content}>
          {safeReview ? (
            <View style={styles.safeBanner}>
              <Ionicons name="heart-outline" size={18} color={colors.status.positive} />
              <Text variant="bodyMd" color="secondary" style={{ flex: 1 }}>
                Your plan focuses on gentle consistency. We’re not setting a weight-loss target —
                your situation deserves a more personalized approach.
              </Text>
            </View>
          ) : null}
          <View style={styles.banner}>
            <ChallengeDateBanner startDate={effectiveStart} lengthDays={challengeLength} />
          </View>

          <View style={styles.weighIn}>
            <WeighInStatus
              done={weighedToday}
              streak={streak}
              todayDisplay={
                weighedToday
                  ? `${data.today.weight.currentDisplay} ${data.today.weight.unit}`
                  : null
              }
              onPress={() => router.push('/weigh-in')}
            />
          </View>

          <TodayBlock data={data} onQuick={(dest) => router.push(dest)} />

          <Section
            title="Daily goals"
            actionLabel="Edit"
            onAction={() => router.push('/goals')}
            style={styles.section}
          >
            <GoalsProgress
              rows={[
                {
                  icon: 'footsteps-outline',
                  label: 'Steps',
                  value: stepsToday,
                  goal: stepsGoal,
                },
                {
                  icon: 'time-outline',
                  label: 'Active minutes',
                  value: activityToday,
                  goal: activityGoal,
                  unit: 'min',
                },
                {
                  icon: 'restaurant-outline',
                  label: 'Calories',
                  value: data.today.calories.consumed,
                  goal: calorieGoal ?? data.today.calories.target,
                  unit: 'kcal',
                },
              ]}
            />
          </Section>

          <Section title="Together" style={styles.section}>
            <CommunityCounters />
          </Section>
        </View>
      </ScreenScaffold>
    </>
  );
}

function TodayBlock({
  data,
  onQuick,
}: {
  data: HomeSnapshot;
  onQuick: (
    dest: '/track' | '/live' | '/weigh-in' | '/activity' | '/log-food' | '/log-steps',
  ) => void;
}) {
  const { today } = data;
  const scoreProgress = today.score / today.scoreMax;
  const change = today.weight.totalChange;

  return (
    <Section title="Today" style={styles.firstSection}>
      <Card>
        <View style={styles.todayRow}>
          <ProgressRing progress={scoreProgress} size={128} strokeWidth={12}>
            <Text variant="displayMd">{today.score}</Text>
            <Text variant="labelSm" color="tertiary">
              / {today.scoreMax}
            </Text>
            <Text variant="labelSm" color="tertiary" style={{ marginTop: 2 }}>
              SCORE
            </Text>
          </ProgressRing>

          <View style={styles.metrics}>
            <MetricCard
              label="CALORIES"
              value={formatThousands(today.calories.consumed)}
              suffix={`/ ${formatThousands(today.calories.target)}`}
              delta={{
                text: `${formatThousands(today.calories.remaining)} remaining`,
                tone: 'neutral',
              }}
            />
            <View style={styles.metricDivider} />
            <MetricCard
              label="WEIGHT"
              value={`${today.weight.currentDisplay}`}
              suffix={today.weight.unit}
              delta={{
                text: `${change.value} ${today.weight.unit} total`,
                tone: change.direction === 'down' ? 'positive' : 'neutral',
                direction: change.direction,
              }}
            />
          </View>
        </View>
      </Card>

      <View style={styles.quickRow}>
        <QuickAction
          icon="restaurant-outline"
          label="Food"
          tone="primary"
          onPress={() => onQuick('/log-food')}
        />
        <QuickAction icon="scale-outline" label="Weigh In" onPress={() => onQuick('/weigh-in')} />
        <QuickAction icon="footsteps-outline" label="Steps" onPress={() => onQuick('/log-steps')} />
        <QuickAction icon="play-outline" label="Activity" onPress={() => onQuick('/activity')} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: layout.screenGutter,
    marginTop: spacing['2xl'],
  },
  firstSection: { marginTop: 0 },
  banner: { marginBottom: spacing.lg },
  weighIn: { marginBottom: spacing.lg },
  section: { marginTop: spacing['2xl'] },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  metrics: { flex: 1, gap: spacing.md },
  metricDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border.hairline },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  safeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(47, 143, 91, 0.06)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
