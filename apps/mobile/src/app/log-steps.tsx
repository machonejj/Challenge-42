import { useState } from 'react';
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useStepsStore, todaySteps } from '@/features/tracking/stepsStore';
import { formatThousands } from '@/lib/format';

const QUICK = [1000, 2500, 5000];

export default function LogSteps(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addSteps = useStepsStore((s) => s.addSteps);
  const today = useStepsStore((s) => todaySteps(s.entries, Date.now()));
  const [value, setValue] = useState('');

  const add = (n: number): void => {
    if (n <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addSteps(n);
  };

  const addTyped = (): void => {
    const n = parseInt(value.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(n) || n <= 0) return;
    add(n);
    setValue('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text variant="titleMd">Log steps</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.close}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text variant="displayLg" color="gold">
            {formatThousands(today)}
          </Text>
          <Text variant="labelMd" color="secondary">
            steps today
          </Text>
        </View>

        <View style={styles.quickRow}>
          {QUICK.map((n) => (
            <Pressable key={n} style={styles.quick} onPress={() => add(n)}>
              <Text variant="labelMd" style={{ color: colors.brand.pine }}>
                +{formatThousands(n)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          OR ENTER A NUMBER
        </Text>
        <TextField
          value={value}
          onChangeText={setValue}
          placeholder="e.g. 7500"
          keyboardType="number-pad"
        />
        <Button
          label="Add steps"
          variant="secondary"
          onPress={addTyped}
          style={{ marginTop: spacing.md }}
        />
        <Button label="Done" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenGutter,
    paddingBottom: spacing.md,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: layout.screenGutter },
  hero: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  quick: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface.sunken,
  },
  sectionLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
});
