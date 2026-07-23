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
import { useHistory, dateKey, type DayData } from '@/features/history/dayHistory';
import { useProfileStore } from '@/features/profile/profileStore';
import { useGoalsStore } from '@/features/goals/goalsStore';
import { useChallengeStore } from '@/features/challenge/challengeStore';
import { formatThousands } from '@/lib/format';

type IconName = keyof typeof Ionicons.glyphMap;

const DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CAL = '#C9A65B';
const WGT = '#12382B';
const STP = '#5B7FA6';
const ACT = '#2F8F5B';

function midnight(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime();
}
function weekStartMs(ms: number): number {
  const d = new Date(ms);
  return ms - d.getDay() * DAY; // back to Sunday
}
function fmtRange(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function CalendarScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const history = useHistory();
  const unit = useProfileStore((s) => s.weightUnit);
  const recommendedCal = useProfileStore((s) => s.recommendation?.calorieTarget ?? null);
  const calorieGoal = useGoalsStore((s) => s.calorieGoal);
  const calTarget = calorieGoal ?? recommendedCal;

  const gStart = useChallengeStore((s) => s.startDate);
  const gLen = useChallengeStore((s) => s.lengthDays);
  const pStart = useProfileStore((s) => s.challengeStartDate);
  const startStr = gStart ?? (pStart ? pStart.slice(0, 10) : null);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMs = startStr ? midnight(startStr) : todayStart;
  const lengthDays = gLen;
  const endMs = startMs + (lengthDays - 1) * DAY;

  // The grid: one buffer week before the start week through one buffer week after the end week.
  const gridStart = weekStartMs(startMs) - 7 * DAY;
  const lastCell = weekStartMs(endMs) + 7 * DAY + 6 * DAY;
  const totalCells = Math.round((lastCell - gridStart) / DAY) + 1;
  const cells = Array.from({ length: totalCells }, (_, i) => gridStart + i * DAY);
  const weeks: number[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayKey = dateKey(todayStart);
  const initialSel =
    todayStart >= gridStart && todayStart <= lastCell ? todayKey : dateKey(startMs);
  const [selected, setSelected] = useState(initialSel);

  const detail: DayData | undefined = history.get(selected);
  const selMs = midnight(selected);
  const selIsToday = selected === todayKey;
  const selInFuture = selMs > todayStart;
  const selDayNum =
    selMs >= startMs && selMs <= endMs ? Math.floor((selMs - startMs) / DAY) + 1 : null;

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
          <Text variant="titleLg">Calendar</Text>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.close}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <View style={styles.rangeChip}>
          <Ionicons name="flag" size={14} color={colors.brand.gold} />
          <Text variant="labelMd">
            {Math.round(lengthDays / 7)}-week challenge · {fmtRange(startMs)} – {fmtRange(endMs)}
          </Text>
        </View>

        <Card style={{ gap: spacing.sm, marginTop: spacing.md }}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <View key={i} style={styles.cell}>
                <Text variant="labelSm" color="tertiary">
                  {w}
                </Text>
              </View>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((ms) => {
                const k = dateKey(ms);
                const d = history.get(k);
                const isToday = k === todayKey;
                const isSel = k === selected;
                const inChallenge = ms >= startMs && ms <= endMs;
                const future = ms > todayStart;
                const isStart = ms === startMs;
                const isEnd = ms === endMs;
                return (
                  <Pressable key={k} style={styles.cell} onPress={() => setSelected(k)}>
                    <View
                      style={[
                        styles.dayInner,
                        inChallenge && styles.dayInChallenge,
                        isSel && styles.daySel,
                        isToday && !isSel && styles.dayToday,
                      ]}
                    >
                      <Text
                        variant="labelSm"
                        style={{
                          color: isSel
                            ? colors.text.onPine
                            : future
                              ? colors.text.tertiary
                              : inChallenge
                                ? colors.text.primary
                                : colors.text.tertiary,
                          fontWeight: isToday || isStart || isEnd ? '700' : '500',
                        }}
                      >
                        {new Date(ms).getDate()}
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
          ))}

          <View style={styles.legend}>
            <Legend color={CAL} label="Calories" />
            <Legend color={WGT} label="Weigh-in" />
            <Legend color={STP} label="Steps" />
            <Legend color={ACT} label="Activity" />
          </View>
          <Text variant="labelSm" color="tertiary" align="center">
            Shaded days are the 6-week challenge; lighter days are the buffer weeks.
          </Text>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.detailLabel}>
          {selIsToday
            ? 'TODAY'
            : new Date(selMs)
                .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                .toUpperCase()}
          {selDayNum ? ` · DAY ${selDayNum}` : ''}
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
    marginBottom: spacing.md,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 166, 91, 0.12)',
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  weekRow: { flexDirection: 'row' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayInner: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayInChallenge: { backgroundColor: 'rgba(18, 56, 43, 0.06)' },
  daySel: { backgroundColor: colors.brand.pine },
  dayToday: { borderWidth: 1.5, borderColor: colors.brand.gold },
  dots: { flexDirection: 'row', gap: 2, height: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.sm,
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
