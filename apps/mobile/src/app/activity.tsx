import { useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ACTIVITY_TYPES, colors, radius, spacing, layout } from '@challenge42/config';
import { formatElapsed } from '@challenge42/domain';
import type { ActivityTypeKey } from '@challenge42/types';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useActivityStore, countToday } from '@/features/activity/activityStore';

type Mode = 'choose' | 'start' | 'timer' | 'log';
const DURATIONS = [10, 15, 20, 30, 45];

function typeLabel(key: ActivityTypeKey): string {
  return ACTIVITY_TYPES.find((t) => t.key === key)?.label ?? key;
}

function TypeGrid({
  value,
  onChange,
}: {
  value: ActivityTypeKey | null;
  onChange: (k: ActivityTypeKey) => void;
}) {
  return (
    <View style={styles.grid}>
      {ACTIVITY_TYPES.map((t) => {
        const on = value === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.typeCard, on && styles.typeCardOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={styles.typeEmoji}>{t.emoji}</Text>
            <Text variant="labelMd" color={on ? 'primary' : 'secondary'}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TimerView({
  type,
  targetMin,
  onFinish,
}: {
  type: ActivityTypeKey;
  targetMin: number;
  onFinish: (durationMin: number) => void;
}) {
  const [running, setRunning] = useState(true);
  const [baseMs, setBaseMs] = useState(0);
  const startRef = useRef<number>(Date.now());
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [running]);

  const elapsedMs = baseMs + (running ? Date.now() - startRef.current : 0);
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const progress = Math.min(elapsedSec / (targetMin * 60), 1);

  const pause = () => {
    setBaseMs((m) => m + (Date.now() - startRef.current));
    setRunning(false);
  };
  const resume = () => {
    startRef.current = Date.now();
    setRunning(true);
  };
  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onFinish(Math.max(1, Math.round(elapsedSec / 60)));
  };

  return (
    <View style={styles.timerWrap}>
      <Text variant="titleMd" align="center">
        {typeLabel(type)}
      </Text>
      <View style={styles.ringWrap}>
        <ProgressRing progress={progress} size={200} strokeWidth={14}>
          <Text variant="displayLg">{formatElapsed(elapsedSec)}</Text>
          <Text variant="labelSm" color="tertiary">
            of {targetMin}:00 min
          </Text>
        </ProgressRing>
      </View>
      <View style={styles.timerBtns}>
        <Button
          label={running ? 'Pause' : 'Resume'}
          variant="secondary"
          icon={running ? 'pause' : 'play'}
          onPress={running ? pause : resume}
          style={{ flex: 1 }}
        />
        <Button label="Finish" icon="checkmark" onPress={finish} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export default function ActivityScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sessions = useActivityStore((s) => s.sessions);
  const addSession = useActivityStore((s) => s.addSession);

  const [mode, setMode] = useState<Mode>('choose');
  const [type, setType] = useState<ActivityTypeKey | null>(null);
  const [durationMin, setDurationMin] = useState<number>(15);
  const [logMinutes, setLogMinutes] = useState('30');
  const [logWhen, setLogWhen] = useState<'today' | 'yesterday'>('today');

  const todayCount = countToday(sessions, Date.now());

  const saveLogged = () => {
    if (!type) return;
    const minutes = Math.max(
      1,
      Math.min(600, parseInt(logMinutes.replace(/[^0-9]/g, ''), 10) || 0),
    );
    if (minutes < 1) return;
    const completedAtMs = logWhen === 'today' ? Date.now() : Date.now() - 24 * 60 * 60 * 1000;
    addSession({ type, title: null, durationMin: minutes, completedAtMs, source: 'logged' });
    router.back();
  };

  const finishLive = (min: number) => {
    if (!type) return;
    addSession({ type, title: null, durationMin: min, completedAtMs: Date.now(), source: 'live' });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        {mode !== 'choose' && mode !== 'timer' ? (
          <Pressable
            onPress={() => setMode('choose')}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text.secondary} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
        <Text variant="titleMd">
          {mode === 'timer' ? 'In progress' : mode === 'log' ? 'Log a workout' : 'Activity'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['3xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'choose' ? (
          <>
            <Pressable onPress={() => setMode('start')}>
              <Card style={styles.choiceCard}>
                <View style={[styles.choiceIcon, styles.choiceIconPrimary]}>
                  <Ionicons name="play" size={22} color={colors.text.onPine} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMd">Start a workout now</Text>
                  <Text variant="bodyMd" color="secondary">
                    Pick a length and we’ll time it for you.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </Card>
            </Pressable>
            <Pressable onPress={() => setMode('log')}>
              <Card style={styles.choiceCard}>
                <View style={styles.choiceIcon}>
                  <Ionicons name="time-outline" size={22} color={colors.brand.pine} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="titleMd">Log a past workout</Text>
                  <Text variant="bodyMd" color="secondary">
                    Already moved today? Add it in a few taps.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </Card>
            </Pressable>
            <Text variant="labelMd" color="tertiary" style={styles.todayLine}>
              {todayCount === 0
                ? 'No workouts logged today yet.'
                : `${todayCount} workout${todayCount > 1 ? 's' : ''} logged today 🎉`}
            </Text>
          </>
        ) : null}

        {mode === 'start' ? (
          <>
            <Text variant="labelSm" color="tertiary" style={styles.stepLabel}>
              WHAT ARE YOU DOING?
            </Text>
            <TypeGrid value={type} onChange={setType} />
            <Text variant="labelSm" color="tertiary" style={styles.stepLabel}>
              FOR HOW LONG?
            </Text>
            <View style={styles.chips}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDurationMin(d)}
                  style={[styles.chip, durationMin === d && styles.chipOn]}
                >
                  <Text
                    variant="labelMd"
                    style={{
                      color: durationMin === d ? colors.text.onPine : colors.text.secondary,
                    }}
                  >
                    {d} min
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              label={type ? `Start ${durationMin}-min ${typeLabel(type)}` : 'Pick an activity'}
              onPress={() => setMode('timer')}
              disabled={!type}
              style={{ marginTop: spacing.xl }}
            />
          </>
        ) : null}

        {mode === 'timer' && type ? (
          <TimerView type={type} targetMin={durationMin} onFinish={finishLive} />
        ) : null}

        {mode === 'log' ? (
          <>
            <Text variant="labelSm" color="tertiary" style={styles.stepLabel}>
              WHAT DID YOU DO?
            </Text>
            <TypeGrid value={type} onChange={setType} />
            <Text variant="labelSm" color="tertiary" style={styles.stepLabel}>
              HOW LONG (MINUTES)?
            </Text>
            <TextField
              value={logMinutes}
              onChangeText={setLogMinutes}
              keyboardType="number-pad"
              placeholder="30"
            />
            <Text variant="labelSm" color="tertiary" style={styles.stepLabel}>
              WHEN?
            </Text>
            <View style={styles.chips}>
              {(['today', 'yesterday'] as const).map((w) => (
                <Pressable
                  key={w}
                  onPress={() => setLogWhen(w)}
                  style={[styles.chip, logWhen === w && styles.chipOn]}
                >
                  <Text
                    variant="labelMd"
                    style={{ color: logWhen === w ? colors.text.onPine : colors.text.secondary }}
                  >
                    {w === 'today' ? 'Today' : 'Yesterday'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              label="Save workout"
              onPress={saveLogged}
              disabled={!type}
              style={{ marginTop: spacing.xl }}
            />
          </>
        ) : null}
      </ScrollView>
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: layout.screenGutter, paddingTop: spacing.lg, gap: spacing.md },
  choiceCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  choiceIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18, 56, 43, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconPrimary: { backgroundColor: colors.brand.pine },
  todayLine: { marginTop: spacing.lg, textAlign: 'center' },
  stepLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  typeCardOn: { borderColor: colors.brand.pine, backgroundColor: 'rgba(18, 56, 43, 0.05)' },
  typeEmoji: { fontSize: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
  },
  chipOn: { backgroundColor: colors.brand.pine },
  timerWrap: { alignItems: 'center', gap: spacing.xl, paddingTop: spacing.xl },
  ringWrap: { marginVertical: spacing.lg },
  timerBtns: { flexDirection: 'row', gap: spacing.md, width: '100%' },
});
