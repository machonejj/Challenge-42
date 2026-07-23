import { useEffect, useState } from 'react';
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
import { isStepSyncAvailable, requestStepPermission } from '@/features/health/healthSteps';
import { syncStepsFromDevice } from '@/features/health/syncSteps';
import { formatThousands } from '@/lib/format';

const QUICK = [1000, 2500, 5000];

export default function LogSteps(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addSteps = useStepsStore((s) => s.addSteps);
  const today = useStepsStore((s) => todaySteps(s.entries, Date.now()));
  const syncEnabled = useStepsStore((s) => s.syncEnabled);
  const setSyncEnabled = useStepsStore((s) => s.setSyncEnabled);
  const [value, setValue] = useState('');
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void isStepSyncAvailable().then(setAvailable);
    void syncStepsFromDevice(); // refresh today's count if already connected
  }, []);

  const connect = async (): Promise<void> => {
    if (syncEnabled) {
      setSyncEnabled(false);
      return;
    }
    setBusy(true);
    setError(null);
    const granted = await requestStepPermission();
    if (granted) {
      setSyncEnabled(true);
      await syncStepsFromDevice();
    } else {
      setError('Motion access was denied. You can turn it on in your phone’s Settings.');
    }
    setBusy(false);
  };

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

        {available ? (
          <View style={styles.syncCard}>
            <Ionicons
              name={syncEnabled ? 'sync-circle' : 'sync-circle-outline'}
              size={26}
              color={syncEnabled ? colors.status.positive : colors.brand.pine}
            />
            <View style={{ flex: 1 }}>
              <Text variant="labelMd">Auto-sync from your phone</Text>
              <Text variant="labelSm" color="tertiary">
                {syncEnabled
                  ? 'On — your step count updates automatically.'
                  : 'Pull steps straight from your phone’s step counter.'}
              </Text>
            </View>
            <Button
              label={syncEnabled ? 'On' : 'Connect'}
              variant={syncEnabled ? 'ghost' : 'secondary'}
              loading={busy}
              onPress={connect}
            />
          </View>
        ) : (
          <View style={styles.syncNote}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.text.tertiary} />
            <Text variant="labelSm" color="secondary" style={{ flex: 1 }}>
              Automatic step sync works in the installed iPhone/Android app. On the web, add steps
              manually below.
            </Text>
          </View>
        )}
        {error ? (
          <Text variant="labelSm" style={{ color: colors.status.danger, marginTop: spacing.sm }}>
            {error}
          </Text>
        ) : null}

        <Text variant="labelSm" color="tertiary" style={styles.orLabel}>
          ADD MANUALLY
        </Text>

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
  hero: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.lg },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.hairline,
    padding: spacing.md,
  },
  syncNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  orLabel: { marginTop: spacing.xl, marginBottom: spacing.sm },
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
