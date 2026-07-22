import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  ONBOARDING_STEPS,
  ONBOARDING_VERSION,
  colors,
  radius,
  spacing,
  layout,
} from '@challenge42/config';
import { canAdvance, nextStepId, progressFor } from '@challenge42/domain';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useAuthStore } from '@/features/auth/authStore';
import { StepInput } from '@/features/onboarding/StepInput';
import { enrollFromOnboarding } from '@/features/enrollment/enroll';
import { getAnalytics } from '@/services/analytics/AnalyticsService';

export default function OnboardingScreen(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const answers = useOnboardingStore((s) => s.answers);
  const currentStepId = useOnboardingStore((s) => s.currentStepId);
  const status = useOnboardingStore((s) => s.status);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const begin = useOnboardingStore((s) => s.begin);
  const goNext = useOnboardingStore((s) => s.goNext);
  const goBack = useOnboardingStore((s) => s.goBack);
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'NOT_STARTED' || !currentStepId) {
      if (status === 'NOT_STARTED') {
        getAnalytics().track('ONBOARDING_STARTED', { version: ONBOARDING_VERSION });
      }
      begin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = useMemo(
    () => ONBOARDING_STEPS.find((s) => s.id === currentStepId) ?? null,
    [currentStepId],
  );

  if (!step) return null;

  const progress = progressFor(ONBOARDING_STEPS, answers, step.id);
  const proceed = canAdvance(step, answers);
  const isLast = nextStepId(ONBOARDING_STEPS, answers, step.id) === null;
  const isFirst = progress.index <= 1;

  const onContinue = async () => {
    getAnalytics().track('ONBOARDING_STEP_COMPLETED', {
      stepId: step.id,
      section: step.section,
      index: progress.index,
    });
    if (isLast) {
      if (!userId) {
        setError('Please sign in again.');
        return;
      }
      setError(null);
      setFinalizing(true);
      const result = await enrollFromOnboarding(userId, answers);
      if (result.ok) {
        router.replace('/(onboarding)/plan-reveal');
      } else {
        setFinalizing(false);
        setError('A few required answers are missing. Please go back and complete them.');
      }
    } else {
      goNext();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={goBack}
          disabled={isFirst}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={[styles.back, isFirst && styles.backHidden]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text.secondary} />
        </Pressable>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.fraction * 100}%` }]} />
          </View>
        </View>
        <Text variant="labelSm" color="tertiary">
          {progress.index}/{progress.total}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleLg" style={styles.title}>
          {step.title}
        </Text>
        {step.subtitle ? (
          <Text variant="bodyLg" color="secondary" style={styles.subtitle}>
            {step.subtitle}
          </Text>
        ) : null}

        <View style={styles.input}>
          <StepInput step={step} answers={answers} setAnswer={setAnswer} />
        </View>

        {step.reassurance ? (
          <View style={styles.reassure}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.status.positive} />
            <Text variant="labelSm" color="secondary" style={{ flex: 1 }}>
              {step.reassurance}
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text variant="labelMd" color="danger" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          label={isLast ? 'See my plan' : 'Continue'}
          onPress={onContinue}
          disabled={!proceed}
          loading={finalizing}
        />
        {!step.required && step.kind !== 'info' ? (
          <Pressable onPress={onContinue} style={styles.skip} accessibilityRole="button">
            <Text variant="labelMd" color="tertiary">
              Skip
            </Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.screenGutter,
    paddingBottom: spacing.md,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHidden: { opacity: 0 },
  progressWrap: { flex: 1 },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.brand.pine },
  content: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  title: { fontSize: 26, lineHeight: 32 },
  subtitle: { marginTop: spacing.md },
  input: { marginTop: spacing['2xl'] },
  reassure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    backgroundColor: 'rgba(47, 143, 91, 0.06)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  error: { marginTop: spacing.lg },
  footer: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.hairline,
  },
  skip: { alignItems: 'center', paddingVertical: spacing.xs },
});
