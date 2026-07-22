import { useEffect } from 'react';
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
import { usePersonalizedHome } from '@/features/home/usePersonalizedHome';
import { useProfileStore } from '@/features/profile/profileStore';
import { getAnalytics } from '@/services/analytics/AnalyticsService';
import { formatThousands } from '@/lib/format';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = usePersonalizedHome();
  const safeReview = useProfileStore((s) => s.safetyStatus === 'SAFE_REVIEW_REQUIRED');

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
          <TodayBlock data={data} onQuick={(dest) => router.push(dest)} />
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
  onQuick: (dest: '/track' | '/live' | '/weigh-in' | '/activity' | '/log-food') => void;
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
          label="Log Food"
          tone="primary"
          onPress={() => onQuick('/log-food')}
        />
        <QuickAction icon="scale-outline" label="Weigh In" onPress={() => onQuick('/weigh-in')} />
        <QuickAction
          icon="play-outline"
          label="Start Activity"
          onPress={() => onQuick('/activity')}
        />
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
