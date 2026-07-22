import { useState } from 'react';
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { displayToKg, kgToDisplay, round } from '@challenge42/domain';
import type { WeightUnit } from '@challenge42/types';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useWeightSummary } from '@/features/tracking/useWeightSummary';

export default function WeighIn(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const summary = useWeightSummary();
  const addWeighIn = useWeightStore((s) => s.addWeighIn);

  const [unit, setUnit] = useState<WeightUnit>(summary.unit);
  const [text, setText] = useState(
    summary.rawLatestDisplay != null ? String(summary.rawLatestDisplay) : '',
  );

  const parsed = parseFloat(text.replace(/[^0-9.]/g, ''));
  const valid = !Number.isNaN(parsed) && parsed > 0 && parsed < 1500;

  const switchUnit = (next: WeightUnit) => {
    if (next === unit) return;
    if (valid) setText(String(round(kgToDisplay(displayToKg(parsed, unit), next), 1)));
    setUnit(next);
  };

  const onSave = () => {
    if (!valid) return;
    addWeighIn(round(displayToKg(parsed, unit), 3));
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.header}>
          <Text variant="titleLg">Weigh in</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={styles.close}
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <Text variant="bodyLg" color="secondary" style={styles.hint}>
          {summary.numbersHidden
            ? 'We’ll log this quietly and keep the number in the background.'
            : 'Weigh in whenever you like — we track the 7-day trend, not the daily number, so a heavy day never counts against you.'}
        </Text>

        <View style={styles.toggle}>
          {(['lb', 'kg'] as const).map((u) => (
            <Pressable
              key={u}
              onPress={() => switchUnit(u)}
              style={[styles.toggleItem, unit === u && styles.toggleItemOn]}
            >
              <Text
                variant="labelMd"
                style={{ color: unit === u ? colors.text.onPine : colors.text.secondary }}
              >
                {u}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextField
          value={text}
          onChangeText={setText}
          placeholder={unit === 'lb' ? 'e.g. 180' : 'e.g. 82'}
          keyboardType="decimal-pad"
          autoFocus
        />

        {summary.loggedToday && !summary.numbersHidden ? (
          <Text variant="labelSm" color="tertiary" style={styles.note}>
            You already logged today — adding another is fine, the trend handles it.
          </Text>
        ) : null}

        <View style={styles.spacer} />
        <Button label="Save weigh-in" onPress={onSave} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  content: { flex: 1, paddingHorizontal: layout.screenGutter, paddingBottom: spacing['3xl'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { marginBottom: spacing.xl, maxWidth: 380 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  toggleItem: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  toggleItemOn: { backgroundColor: colors.brand.pine },
  note: { marginTop: spacing.sm },
  spacer: { flex: 1 },
});
