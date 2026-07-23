import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { computeWindow } from '@/features/challenge/challengeStore';

type IconName = keyof typeof Ionicons.glyphMap;

function fmt(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

/** An obvious, always-visible banner for when the challenge starts / what day it is. */
export function ChallengeDateBanner({
  startDate,
  lengthDays,
}: {
  startDate: string | null;
  lengthDays: number;
}): React.JSX.Element | null {
  if (!startDate) return null;
  const w = computeWindow(startDate, lengthDays, Date.now());

  let icon: IconName;
  let title: string;
  let sub: string;
  if (!w.hasStarted) {
    icon = 'flag-outline';
    title = `Challenge starts ${fmt(w.startMs)}`;
    sub =
      w.startsInDays === 0
        ? 'Starts today — let’s go'
        : `${w.startsInDays} day${w.startsInDays === 1 ? '' : 's'} to go — get ready`;
  } else if (w.hasEnded) {
    icon = 'trophy-outline';
    title = 'Challenge complete';
    sub = `${fmt(w.startMs)} – ${fmt(w.endMs)}`;
  } else {
    icon = 'calendar-outline';
    title = `Day ${w.dayNumber} of ${w.totalDays}`;
    sub = `Started ${fmt(w.startMs)} · ends ${fmt(w.endMs)}`;
  }

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.brand.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelMd">{title}</Text>
        <Text variant="labelSm" color="secondary">
          {sub}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(201, 166, 91, 0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 166, 91, 0.35)',
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(201, 166, 91, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
