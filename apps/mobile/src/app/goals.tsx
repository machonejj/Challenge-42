import { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGoalsStore } from '@/features/goals/goalsStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { formatThousands } from '@/lib/format';

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

function Stepper({
  value,
  step,
  min,
  max,
  onChange,
  format,
  suffix,
}: {
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  suffix?: string;
}) {
  const dec = () => onChange(clamp(value - step, min, max));
  const inc = () => onChange(clamp(value + step, min, max));
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={dec}
        disabled={value <= min}
        style={[styles.stepBtn, value <= min && styles.stepBtnOff]}
        accessibilityLabel="Decrease"
      >
        <Ionicons name="remove" size={22} color={colors.text.onPine} />
      </Pressable>
      <View style={styles.stepValue}>
        <Text variant="displayMd">{format ? format(value) : value}</Text>
        {suffix ? (
          <Text variant="labelSm" color="tertiary">
            {suffix}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={inc}
        disabled={value >= max}
        style={[styles.stepBtn, value >= max && styles.stepBtnOff]}
        accessibilityLabel="Increase"
      >
        <Ionicons name="add" size={22} color={colors.text.onPine} />
      </Pressable>
    </View>
  );
}

export default function GoalsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goals = useGoalsStore();
  const recommendedCal = useProfileStore((s) => s.recommendation?.calorieTarget ?? null);

  const [steps, setSteps] = useState(goals.stepsGoal);
  const [activity, setActivity] = useState(goals.activityMinutesGoal);
  const [useRecommended, setUseRecommended] = useState(goals.calorieGoal == null);
  const [calorie, setCalorie] = useState(goals.calorieGoal ?? recommendedCal ?? 2000);

  const save = (): void => {
    goals.setGoals({
      stepsGoal: steps,
      activityMinutesGoal: activity,
      calorieGoal: useRecommended ? null : calorie,
    });
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing['4xl'],
          paddingHorizontal: layout.screenGutter,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="titleLg">Your goals</Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.close}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>
        <Text variant="bodyMd" color="secondary" style={styles.intro}>
          Set daily targets that fit your life. You can change these any time.
        </Text>

        <Text variant="labelSm" color="tertiary" style={styles.label}>
          DAILY STEPS
        </Text>
        <Card>
          <Stepper
            value={steps}
            step={500}
            min={2000}
            max={30000}
            onChange={setSteps}
            format={(v) => formatThousands(v)}
            suffix="steps"
          />
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.label}>
          ACTIVE MINUTES
        </Text>
        <Card>
          <Stepper
            value={activity}
            step={5}
            min={0}
            max={180}
            onChange={setActivity}
            suffix="minutes a day"
          />
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.label}>
          DAILY CALORIES
        </Text>
        <Card style={{ gap: spacing.md }}>
          <View style={styles.segmented}>
            {[
              { on: useRecommended, label: 'Recommended', v: true },
              { on: !useRecommended, label: 'Custom', v: false },
            ].map((o) => (
              <Pressable
                key={o.label}
                onPress={() => setUseRecommended(o.v)}
                style={[styles.seg, o.on && styles.segOn]}
              >
                <Text
                  variant="labelSm"
                  style={{ color: o.on ? colors.text.onPine : colors.text.secondary }}
                >
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {useRecommended ? (
            <View style={styles.recommended}>
              <Text variant="displayMd">
                {recommendedCal != null ? formatThousands(recommendedCal) : '—'}
              </Text>
              <Text variant="labelSm" color="tertiary">
                {recommendedCal != null
                  ? 'kcal · from your safety-checked plan'
                  : 'Finish onboarding to get a recommended target'}
              </Text>
            </View>
          ) : (
            <Stepper
              value={calorie}
              step={50}
              min={1200}
              max={4000}
              onChange={setCalorie}
              format={(v) => formatThousands(v)}
              suffix="kcal a day"
            />
          )}
          <Text variant="labelSm" color="tertiary">
            We never set an unsafe deficit — custom goals stay within healthy limits.
          </Text>
        </Card>

        <Button label="Save goals" onPress={save} style={styles.save} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: { marginBottom: spacing.lg },
  label: { marginTop: spacing.xl, marginBottom: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { backgroundColor: colors.text.tertiary, opacity: 0.4 },
  stepValue: { alignItems: 'center', flex: 1 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  segOn: { backgroundColor: colors.brand.pine },
  recommended: { alignItems: 'center', paddingVertical: spacing.sm },
  save: { marginTop: spacing['2xl'] },
});
