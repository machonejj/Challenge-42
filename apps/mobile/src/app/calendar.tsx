import { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { kgToDisplay, round } from '@challenge42/domain';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { useHistory, keyForYMD, dateKey, type DayData } from '@/features/history/dayHistory';
import { useProfileStore } from '@/features/profile/profileStore';
import { useGoalsStore } from '@/features/goals/goalsStore';
import { formatThousands } from '@/lib/format';

type IconName = keyof typeof Ionicons.glyphMap;

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CAL = '#C9A65B'; // calories
const WGT = '#12382B'; // weigh-in
const STP = '#5B7FA6'; // steps
const ACT = '#2F8F5B'; // activity

export default function CalendarScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const history = useHistory();
  const unit = useProfileStore((s) => s.weightUnit);
  const recommendedCal = useProfileStore((s) => s.recommendation?.calorieTarget ?? null);
  const calorieGoal = useGoalsStore((s) => s.calorieGoal);
  const calTarget = calorieGoal ?? recommendedCal;

  const now = new Date();
  const todayKey = dateKey(now.getTime());
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState(todayKey);

  const isCurrentMonth = view.y === now.getFullYear() && view.m === now.getMonth();
  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shiftMonth = (delta: number): void => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const detail: DayData | undefined = history.get(selected);
  const selDate = new Date(`${selected}T00:00:00`);
  const selIsToday = selected === todayKey;
  const selInFuture = selDate.getTime() > new Date(todayKey + 'T00:00:00').getTime();

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
          <Text variant="titleLg">History</Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.close}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <Card style={{ gap: spacing.md }}>
          <View style={styles.monthRow}>
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.text.secondary} />
            </Pressable>
            <Text variant="labelMd">
              {MONTHS[view.m]} {view.y}
            </Text>
            <Pressable
              onPress={() => shiftMonth(1)}
              hitSlop={8}
              style={styles.navBtn}
              disabled={isCurrentMonth}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isCurrentMonth ? colors.border.strong : colors.text.secondary}
              />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <View key={i} style={styles.cell}>
                <Text variant="labelSm" color="tertiary">
                  {w}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day == null) return <View key={`b${i}`} style={styles.cell} />;
              const k = keyForYMD(view.y, view.m, day);
              const d = history.get(k);
              const isToday = k === todayKey;
              const isSel = k === selected;
              const future = new Date(`${k}T00:00:00`).getTime() > todayStart;
              return (
                <Pressable
                  key={k}
                  style={styles.cell}
                  onPress={() => setSelected(k)}
                  disabled={future}
                >
                  <View
                    style={[styles.dayInner, isSel && styles.daySel, isToday && styles.dayToday]}
                  >
                    <Text
                      variant="labelSm"
                      style={{
                        color: future
                          ? colors.border.strong
                          : isSel
                            ? colors.text.onPine
                            : colors.text.primary,
                        fontWeight: isToday ? '700' : '500',
                      }}
                    >
                      {day}
                    </Text>
                    <View style={styles.dots}>
                      {d?.hasFood ? <Dot color={CAL} on={isSel} /> : null}
                      {d?.hasWeight ? <Dot color={WGT} on={isSel} /> : null}
                      {d?.hasSteps ? <Dot color={STP} on={isSel} /> : null}
                      {d?.hasActivity ? <Dot color={ACT} on={isSel} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            <Legend color={CAL} label="Calories" />
            <Legend color={WGT} label="Weigh-in" />
            <Legend color={STP} label="Steps" />
            <Legend color={ACT} label="Activity" />
          </View>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.detailLabel}>
          {selIsToday
            ? 'TODAY'
            : selDate
                .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                .toUpperCase()}
        </Text>

        {selInFuture ? (
          <Card>
            <Text variant="bodyMd" color="secondary">
              Nothing logged yet — this day hasn’t happened.
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            <View style={styles.detailList}>
              <DetailRow
                icon="restaurant-outline"
                color={CAL}
                label="Calories"
                value={
                  detail && detail.hasFood
                    ? `${formatThousands(detail.calories)}${calTarget ? ` / ${formatThousands(calTarget)}` : ''} kcal`
                    : 'Not logged'
                }
                onPress={selIsToday ? () => router.push('/log-food') : undefined}
              />
              <DetailRow
                icon="scale-outline"
                color={WGT}
                label="Weigh-in"
                value={
                  detail && detail.weightKg != null
                    ? `${round(kgToDisplay(detail.weightKg, unit), 1)} ${unit}`
                    : 'Not logged'
                }
                onPress={selIsToday ? () => router.push('/weigh-in') : undefined}
              />
              <DetailRow
                icon="footsteps-outline"
                color={STP}
                label="Steps"
                value={detail && detail.hasSteps ? formatThousands(detail.steps) : 'Not logged'}
                onPress={selIsToday ? () => router.push('/log-steps') : undefined}
              />
              <DetailRow
                icon="barbell-outline"
                color={ACT}
                label="Activities"
                value={
                  detail && detail.activities.length > 0
                    ? detail.activities.map((a) => `${a.title} · ${a.durationMin}m`).join('\n')
                    : 'Not logged'
                }
                onPress={selIsToday ? () => router.push('/activity') : undefined}
                multiline
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function Dot({ color, on }: { color: string; on: boolean }) {
  return <View style={[styles.dot, { backgroundColor: on ? colors.surface.card : color }]} />;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="labelSm" color="tertiary">
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
  icon,
  color,
  label,
  value,
  onPress,
  multiline,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: string;
  onPress?: () => void;
  multiline?: boolean;
}) {
  return (
    <Pressable
      style={styles.detailRow}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={[styles.detailIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text variant="labelMd" style={{ width: 78 }}>
        {label}
      </Text>
      <Text
        variant="bodyMd"
        color="secondary"
        style={{ flex: 1 }}
        numberOfLines={multiline ? 4 : 1}
      >
        {value}
      </Text>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
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
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayInner: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  daySel: { backgroundColor: colors.brand.pine },
  dayToday: { borderWidth: 1.5, borderColor: colors.brand.gold },
  dots: { flexDirection: 'row', gap: 2, height: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  detailList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
