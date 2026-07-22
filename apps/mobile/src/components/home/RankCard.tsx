import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import type { HomeRankSummary } from '@challenge42/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

/** Overall challenge rank, rank movement, and distance to the next meaningful target. */
export function RankCard({ rank }: { rank: HomeRankSummary }): React.JSX.Element {
  const movedUp = rank.movement > 0;
  const movedDown = rank.movement < 0;
  const movementColor = movedUp
    ? colors.status.positive
    : movedDown
      ? colors.status.danger
      : colors.text.tertiary;

  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.rankWrap}>
          <Text variant="labelSm" color="tertiary">
            OVERALL RANK
          </Text>
          <View style={styles.rankRow}>
            <Text variant="displayMd" color="gold">
              #{rank.overall}
            </Text>
            {rank.movement !== 0 ? (
              <View style={styles.movement}>
                <Ionicons
                  name={movedUp ? 'caret-up' : 'caret-down'}
                  size={14}
                  color={movementColor}
                />
                <Text variant="labelMd" style={{ color: movementColor }}>
                  {Math.abs(rank.movement)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.badge}>
          <Ionicons name="trophy-outline" size={22} color={colors.brand.gold} />
        </View>
      </View>

      <View style={styles.nextRow}>
        <Text variant="bodyMd" color="secondary">
          {rank.pointsToNextTarget} points from{' '}
          <Text variant="bodyMd" color="primary">
            {rank.nextTargetLabel}
          </Text>
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rankWrap: { gap: spacing.xs },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  movement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surface.sunken,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(201, 166, 91, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextRow: { marginTop: spacing.md },
});
