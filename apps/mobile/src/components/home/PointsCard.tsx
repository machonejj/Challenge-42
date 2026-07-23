import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { usePoints } from '@/features/points/points';
import { formatThousands } from '@/lib/format';

type IconName = keyof typeof Ionicons.glyphMap;

/** A rewarding points summary: total, level + progress, and what you earned today. */
export function PointsCard(): React.JSX.Element {
  const p = usePoints();
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.starWrap}>
          <Ionicons name="star" size={20} color="#1C1A15" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="displayMd" color="onPine">
            {formatThousands(p.total)}
          </Text>
          <Text variant="labelSm" style={{ color: colors.text.onPineMuted }}>
            points · Level {p.level}
          </Text>
        </View>
        {p.today > 0 ? (
          <View style={styles.todayPill}>
            <Text variant="labelSm" style={styles.todayText}>
              +{formatThousands(p.today)} today
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(p.levelProgress * 100, 3)}%` }]} />
      </View>
      <Text variant="labelSm" style={{ color: colors.text.onPineMuted }}>
        {p.toNextLevel} pts to Level {p.level + 1}
      </Text>

      <View style={styles.parts}>
        {p.parts.map((part) => (
          <View key={part.label} style={styles.part}>
            <Ionicons name={part.icon as IconName} size={14} color={colors.brand.gold} />
            <Text variant="labelSm" style={{ color: colors.text.onPineMuted }}>
              {formatThousands(part.points)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.pine,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  starWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPill: {
    backgroundColor: 'rgba(201, 166, 91, 0.20)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  todayText: { color: colors.brand.gold, fontWeight: '700' },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(247, 243, 232, 0.16)',
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.brand.gold },
  parts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(247, 243, 232, 0.14)',
  },
  part: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
