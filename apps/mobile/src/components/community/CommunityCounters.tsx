import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { useCommunityStats } from '@/features/live/community';
import { formatThousands } from '@/lib/format';

type IconName = keyof typeof Ionicons.glyphMap;

function fmt(n: number): string {
  if (n >= 100) return formatThousands(Math.round(n));
  return String(Math.round(n * 10) / 10);
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={colors.brand.gold} />
      </View>
      <Text variant="titleLg" color="gold" numberOfLines={1} style={styles.value}>
        {value}
      </Text>
      <Text variant="labelSm" color="onPineMuted">
        {label}
      </Text>
    </View>
  );
}

/** The "together" totals: steps, pounds lost combined, and meals tracked across the challenge. */
export function CommunityCounters(): React.JSX.Element {
  const s = useCommunityStats();
  return (
    <View style={styles.card}>
      <Stat icon="footsteps-outline" value={fmt(s.steps)} label="steps" />
      <View style={styles.divider} />
      <Stat icon="trending-down-outline" value={fmt(s.lbsLost)} label="lbs lost" />
      <View style={styles.divider} />
      <Stat icon="restaurant-outline" value={fmt(s.meals)} label="meals" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.pine,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(201, 166, 91, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  value: { textAlign: 'center' },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(247,243,232,0.14)',
  },
});
