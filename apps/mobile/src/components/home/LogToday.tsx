import { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { kgToDisplay, round } from '@challenge42/domain';
import type { MealSlot, WeightUnit } from '@challenge42/types';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Divider } from '@/components/ui/Divider';
import { useFoodLogStore } from '@/features/tracking/foodLogStore';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useStepsStore, todaySteps } from '@/features/tracking/stepsStore';
import { useActivityStore } from '@/features/activity/activityStore';
import { QUICK_ADDS } from '@/features/activity/quickAdds';
import { activityPoints } from '@/features/points/pointsConfig';
import { isStepSyncAvailable, requestStepPermission } from '@/features/health/healthSteps';
import { syncStepsFromDevice } from '@/features/health/syncSteps';
import { formatThousands } from '@/lib/format';

type IconName = keyof typeof Ionicons.glyphMap;
type Panel = 'food' | 'weight' | 'steps' | 'activity' | null;

function defaultSlot(): MealSlot {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}
function isToday(ms: number): boolean {
  const d = new Date();
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return ms >= s;
}

export interface LogTodayProps {
  consumed: number;
  calorieTarget: number;
  unit: WeightUnit;
  onSearchFoods: () => void;
  onFullActivity: () => void;
}

/** Expandable "log today" rows — everything is entered in place, no navigation. */
export function LogToday({
  consumed,
  calorieTarget,
  unit,
  onSearchFoods,
  onFullActivity,
}: LogTodayProps): React.JSX.Element {
  const [open, setOpen] = useState<Panel>(null);

  const addFood = useFoodLogStore((s) => s.addEntry);
  const addWeighIn = useWeightStore((s) => s.addWeighIn);
  const weightEntries = useWeightStore((s) => s.entries);
  const stepsToday = useStepsStore((s) => todaySteps(s.entries, Date.now()));
  const syncEnabled = useStepsStore((s) => s.syncEnabled);
  const setSyncEnabled = useStepsStore((s) => s.setSyncEnabled);
  const sessions = useActivityStore((s) => s.sessions);
  const addSession = useActivityStore((s) => s.addSession);

  const activityToday = sessions.filter((a) => isToday(a.completedAtMs)).length;
  const latest = weightEntries.length ? weightEntries[weightEntries.length - 1] : null;
  const latestDisplay = latest
    ? `${round(kgToDisplay(latest.weightKg, unit), 1)} ${unit}`
    : 'Not logged';
  const weighedToday = weightEntries.some((e) => isToday(e.measuredAtMs));

  const [fName, setFName] = useState('');
  const [fCal, setFCal] = useState('');
  const [fPro, setFPro] = useState('');
  const addFoodInline = (): void => {
    const cal = parseInt(fCal.replace(/[^0-9]/g, ''), 10);
    if (!fName.trim() || Number.isNaN(cal) || cal <= 0) return;
    const pro = parseInt(fPro.replace(/[^0-9]/g, ''), 10);
    addFood({
      slot: defaultSlot(),
      label: fName.trim(),
      calories: cal,
      proteinG: Number.isNaN(pro) ? 0 : pro,
    });
    setFName('');
    setFCal('');
    setFPro('');
  };

  const [wVal, setWVal] = useState('');
  const saveWeight = (): void => {
    const v = parseFloat(wVal.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(v) || v <= 0) return;
    addWeighIn(unit === 'lb' ? v / 2.2046226 : v);
    setWVal('');
    setOpen(null);
  };

  const [stepAvail, setStepAvail] = useState(false);
  useEffect(() => {
    void isStepSyncAvailable().then(setStepAvail);
  }, []);
  const connectSteps = async (): Promise<void> => {
    const granted = await requestStepPermission();
    if (granted) {
      setSyncEnabled(true);
      await syncStepsFromDevice();
    }
  };

  const rows: {
    key: Exclude<Panel, null>;
    icon: IconName;
    label: string;
    summary: string;
    badge?: { text: string; tone: 'done' | 'due' };
  }[] = [
    {
      key: 'food',
      icon: 'restaurant-outline',
      label: 'Food',
      summary: `${formatThousands(consumed)} / ${formatThousands(calorieTarget)} cal`,
    },
    {
      key: 'weight',
      icon: 'scale-outline',
      label: 'Weigh in',
      summary: weighedToday ? latestDisplay : latest ? `Last: ${latestDisplay}` : 'Not logged yet',
      badge: weighedToday
        ? { text: 'Logged today', tone: 'done' }
        : { text: 'Due today', tone: 'due' },
    },
    {
      key: 'steps',
      icon: 'footsteps-outline',
      label: 'Steps',
      summary: `${formatThousands(stepsToday)} today`,
    },
    {
      key: 'activity',
      icon: 'barbell-outline',
      label: 'Activity',
      summary: activityToday === 0 ? 'None today' : `${activityToday} today`,
    },
  ];

  const panel = (key: Exclude<Panel, null>): React.JSX.Element => {
    if (key === 'food') {
      return (
        <View style={styles.panel}>
          <TextField
            value={fName}
            onChangeText={setFName}
            placeholder="Food (e.g. Turkey sandwich)"
          />
          <View style={styles.rowInputs}>
            <View style={{ flex: 1.3 }}>
              <TextField
                value={fCal}
                onChangeText={setFCal}
                placeholder="Calories"
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                value={fPro}
                onChangeText={setFPro}
                placeholder="Protein g"
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Button label="Add food" onPress={addFoodInline} />
          <Pressable onPress={onSearchFoods} style={styles.link}>
            <Ionicons name="search" size={14} color={colors.brand.pine} />
            <Text variant="labelSm" style={{ color: colors.brand.pine }}>
              Search the full food catalog
            </Text>
          </Pressable>
        </View>
      );
    }
    if (key === 'weight') {
      return (
        <View style={styles.panel}>
          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <TextField
                value={wVal}
                onChangeText={setWVal}
                placeholder={`Today's weight (${unit})`}
                keyboardType="decimal-pad"
              />
            </View>
            <Button label="Save" onPress={saveWeight} style={styles.saveBtn} />
          </View>
          <Text variant="labelSm" color="tertiary">
            One weigh-in per day — a new entry replaces today’s.
          </Text>
        </View>
      );
    }
    if (key === 'steps') {
      return (
        <View style={styles.panel}>
          {stepAvail ? (
            syncEnabled ? (
              <>
                <Text variant="bodyMd" color="secondary">
                  Auto-sync is on ✓ — {formatThousands(stepsToday)} steps today, read from your
                  phone.
                </Text>
                <Button
                  label="Refresh now"
                  variant="secondary"
                  onPress={() => void syncStepsFromDevice()}
                />
              </>
            ) : (
              <>
                <Text variant="bodyMd" color="secondary">
                  Connect your phone’s step counter and steps log automatically.
                </Text>
                <Button label="Connect step counter" onPress={() => void connectSteps()} />
              </>
            )
          ) : (
            <Text variant="bodyMd" color="secondary">
              Steps read automatically from your phone in the installed app — no manual entry. On
              the web there’s nothing to sync.
            </Text>
          )}
        </View>
      );
    }
    // activity
    return (
      <View style={styles.panel}>
        <View style={styles.quickGrid}>
          {QUICK_ADDS.map((q) => (
            <Pressable
              key={q.label}
              style={styles.quickChip}
              onPress={() =>
                addSession({
                  type: q.type,
                  title: q.label,
                  durationMin: q.durationMin,
                  completedAtMs: Date.now(),
                  source: 'logged',
                })
              }
            >
              <Text>{q.emoji}</Text>
              <Text variant="labelSm" numberOfLines={1} style={{ flex: 1 }}>
                {q.label}
              </Text>
              <Text variant="labelSm" color="tertiary">
                +{activityPoints(q.durationMin)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onFullActivity} style={styles.link}>
          <Ionicons name="timer-outline" size={14} color={colors.brand.pine} />
          <Text variant="labelSm" style={{ color: colors.brand.pine }}>
            Start a timed workout
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Card padded={false}>
      {rows.map((r, i) => (
        <View key={r.key}>
          {i > 0 ? <Divider /> : null}
          <Pressable
            style={styles.header}
            onPress={() => setOpen((o) => (o === r.key ? null : r.key))}
            accessibilityRole="button"
          >
            <View style={styles.iconWrap}>
              <Ionicons name={r.icon} size={18} color={colors.brand.pine} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="labelMd">{r.label}</Text>
              <Text variant="labelSm" color="tertiary">
                {r.summary}
              </Text>
            </View>
            {r.badge ? (
              <View
                style={[styles.badge, r.badge.tone === 'done' ? styles.badgeDone : styles.badgeDue]}
              >
                {r.badge.tone === 'done' ? (
                  <Ionicons name="checkmark-circle" size={13} color={colors.status.positive} />
                ) : null}
                <Text
                  variant="labelSm"
                  style={{ color: r.badge.tone === 'done' ? colors.status.positive : '#8A6D2B' }}
                >
                  {r.badge.text}
                </Text>
              </View>
            ) : null}
            <Ionicons
              name={open === r.key ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={colors.text.tertiary}
            />
          </Pressable>
          {open === r.key ? panel(r.key) : null}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18, 56, 43, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeDone: { backgroundColor: 'rgba(47, 143, 91, 0.12)' },
  badgeDue: { backgroundColor: 'rgba(201, 166, 91, 0.16)' },
  panel: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  rowInputs: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  saveBtn: { paddingHorizontal: spacing.xl },
  link: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickChip: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
  },
});
