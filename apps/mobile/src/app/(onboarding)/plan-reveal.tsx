import { useEffect, useRef, type ReactNode } from 'react';
import { View, Animated, Easing, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { kgToDisplay, round } from '@challenge42/domain';
import type { CookForCount, FalloffTrigger } from '@challenge42/types';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useProfileStore } from '@/features/profile/profileStore';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { getAnalytics } from '@/services/analytics/AnalyticsService';
import { formatThousands } from '@/lib/format';

const RISK_LABELS: Record<FalloffTrigger, string> = {
  weekends: 'Weekends',
  eating_out: 'Eating out',
  stress: 'Stress',
  poor_sleep: 'Poor sleep',
  work: 'Work',
  kids: 'Busy days',
  travel: 'Travel',
  hunger: 'Hunger',
  motivation: 'Motivation dips',
  all_or_nothing: 'All-or-nothing thinking',
  missing_one_day: 'Missing one day',
  other: 'Curveballs',
};

const COOK_FOR_LABEL: Record<CookForCount, string> = {
  '1': 'just you',
  '2': '2 people',
  '3_4': '4 people',
  '5_plus': '5+ people',
};

function RevealBlock({ index, children }: { index: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const a = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.timing(a, {
      toValue: 1,
      duration: 420,
      delay: index * 170,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [a, index, reduced]);
  const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}

function Block({
  index,
  eyebrow,
  children,
}: {
  index: number;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <RevealBlock index={index}>
      <View style={styles.block}>
        <Text variant="labelSm" style={styles.eyebrow}>
          {eyebrow}
        </Text>
        {children}
      </View>
    </RevealBlock>
  );
}

export default function PlanReveal(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rec = useProfileStore((s) => s.recommendation);
  const firstName = useProfileStore((s) => s.firstName);
  const unit = useProfileStore((s) => s.weightUnit);
  const answers = useOnboardingStore((s) => s.answers);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  useEffect(() => {
    if (rec) {
      getAnalytics().track('PLAN_REVEALED', {
        safeReviewRequired: rec.status === 'SAFE_REVIEW_REQUIRED',
      });
    }
  }, [rec]);

  if (!rec) return null;

  const safeReview = rec.status === 'SAFE_REVIEW_REQUIRED';
  const risk = answers.falloffTriggers?.[0] ? RISK_LABELS[answers.falloffTriggers[0]] : 'Weekends';
  const goalKg = answers.goalWeightKg;

  const planTags: string[] = [];
  if (answers.cookTimePref === 'under_15' || answers.cookTimePref === '15_30')
    planTags.push('Under 30 minutes');
  else if (answers.cookTimePref === '30_45') planTags.push('Under 45 minutes');
  if (answers.costImportance === 'very' || answers.costImportance === 'somewhat')
    planTags.push('Budget-aware');
  if (answers.cookForCount) planTags.push(`Built for ${COOK_FOR_LABEL[answers.cookForCount]}`);

  const onEnter = () => {
    markCompleted();
    router.replace('/(tabs)');
  };

  let idx = 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing['5xl'],
          paddingBottom: insets.bottom + spacing['6xl'],
          paddingHorizontal: layout.screenGutter,
        }}
        showsVerticalScrollIndicator={false}
      >
        <RevealBlock index={idx++}>
          <Text variant="labelSm" style={styles.eyebrow}>
            WE’VE GOT YOU{firstName ? `, ${firstName.toUpperCase()}` : ''}
          </Text>
          <Text variant="displayLg" style={styles.hero}>
            Your 42-day plan is ready.
          </Text>
        </RevealBlock>

        <Block index={idx++} eyebrow="YOUR FOCUS">
          <Text variant="titleLg" style={styles.value}>
            {rec.primaryFocus}
          </Text>
          <Text variant="bodyLg" style={styles.body}>
            The 42-day win is showing up — not being perfect.
          </Text>
        </Block>

        <Block index={idx++} eyebrow="YOUR NUTRITION">
          {safeReview ? (
            <Text variant="bodyLg" style={styles.body}>
              {rec.explanation}
            </Text>
          ) : (
            <>
              <Text variant="displayMd" style={styles.value}>
                ≈ {formatThousands(rec.calorieTargetRangeKcal!.low)}–
                {formatThousands(rec.calorieTargetRangeKcal!.high)}
              </Text>
              <Text variant="bodyMd" style={styles.bodyMuted}>
                calories per day (an estimate, not medical advice)
              </Text>
              {rec.proteinTargetG ? (
                <Text variant="bodyLg" style={[styles.body, { marginTop: spacing.md }]}>
                  Protein target: {rec.proteinTargetG}g+
                </Text>
              ) : null}
            </>
          )}
        </Block>

        <Block index={idx++} eyebrow="YOUR MOVEMENT">
          <Text variant="titleLg" style={styles.value}>
            {formatThousands(rec.movement.dailySteps)} daily steps
          </Text>
          <Text variant="bodyLg" style={styles.body}>
            {rec.movement.sessionsPerWeek} intentional activity sessions per week.
          </Text>
        </Block>

        {planTags.length > 0 ? (
          <Block index={idx++} eyebrow="YOUR REAL-LIFE PLAN">
            <View style={styles.tags}>
              {planTags.map((t) => (
                <Pill key={t} label={t} tone="pineOutline" />
              ))}
            </View>
          </Block>
        ) : null}

        {!safeReview && goalKg ? (
          <Block index={idx++} eyebrow="LONG-TERM GOAL">
            <Text variant="titleLg" style={styles.value}>
              {round(kgToDisplay(goalKg, unit), 0)} {unit}
            </Text>
            {rec.weightLossRangeKg ? (
              <Text variant="bodyLg" style={styles.body}>
                Suggested 42-day progress: {round(kgToDisplay(rec.weightLossRangeKg.low, unit), 0)}–
                {round(kgToDisplay(rec.weightLossRangeKg.high, unit), 0)} {unit}. No promises — just
                a healthy range.
              </Text>
            ) : null}
          </Block>
        ) : null}

        <Block index={idx++} eyebrow="YOUR BIGGEST RISK">
          <Text variant="titleLg" style={styles.value}>
            {risk}
          </Text>
          <Text variant="bodyLg" style={styles.body}>
            We’ll help you plan for those before they happen — no shame when life happens.
          </Text>
        </Block>

        <RevealBlock index={idx++}>
          <Text variant="displayMd" style={[styles.hero, { marginTop: spacing['3xl'] }]}>
            42 days. One reset.
          </Text>
        </RevealBlock>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button label="Enter the challenge" onPress={onEnter} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.pine },
  eyebrow: { color: colors.brand.gold, letterSpacing: 2 },
  hero: { color: colors.text.onPine, marginTop: spacing.md },
  block: { marginTop: spacing['3xl'] },
  value: { color: colors.text.onPine, marginTop: spacing.sm },
  body: { color: colors.text.onPineMuted, marginTop: spacing.sm, maxWidth: 360 },
  bodyMuted: { color: 'rgba(247, 243, 232, 0.55)', marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  footer: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.md,
  },
});
