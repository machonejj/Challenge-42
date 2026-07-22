import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import type { LeaderboardEntry } from '@challenge42/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Divider } from '@/components/ui/Divider';
import { formatThousands } from '@/lib/format';

function Movement({ entry }: { entry: LeaderboardEntry }) {
  if (entry.previous_rank === null) return null;
  const diff = entry.previous_rank - entry.rank; // positive = moved up
  if (diff === 0)
    return (
      <Text variant="labelSm" color="tertiary">
        —
      </Text>
    );
  const up = diff > 0;
  const color = up ? colors.status.positive : colors.status.danger;
  return (
    <View style={styles.movement}>
      <Ionicons name={up ? 'caret-up' : 'caret-down'} size={12} color={color} />
      <Text variant="labelSm" style={{ color }}>
        {Math.abs(diff)}
      </Text>
    </View>
  );
}

function Row({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View style={[styles.row, entry.is_current_user && styles.currentRow]}>
      <Text
        variant="titleMd"
        color={entry.is_current_user ? 'gold' : 'primary'}
        style={styles.rank}
      >
        {entry.rank}
      </Text>
      <Avatar name={entry.display_name} size={34} tone={entry.is_current_user ? 'gold' : 'pine'} />
      <View style={styles.info}>
        <Text variant="labelMd" numberOfLines={1}>
          {entry.display_name}
        </Text>
        <Text variant="labelSm" color="tertiary" numberOfLines={1}>
          {entry.team_name} · 🔥 {entry.current_streak}
        </Text>
      </View>
      <View style={styles.right}>
        <Text variant="labelMd">{formatThousands(entry.points)}</Text>
        <Movement entry={entry} />
      </View>
    </View>
  );
}

/** Compact leaderboard: top-N plus a sticky, highlighted "you" row. */
export function LeaderboardPreview({
  top,
  currentUser,
}: {
  top: readonly LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
}): React.JSX.Element {
  const currentInTop = currentUser ? top.some((e) => e.is_current_user) : false;
  return (
    <Card padded={false}>
      <View style={styles.list}>
        {top.map((entry, i) => (
          <View key={entry.challenge_member_id}>
            {i > 0 ? <Divider /> : null}
            <Row entry={entry} />
          </View>
        ))}
        {currentUser && !currentInTop ? (
          <>
            <View style={styles.gap}>
              <Text variant="labelSm" color="tertiary" align="center">
                • • •
              </Text>
            </View>
            <Row entry={currentUser} />
          </>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  currentRow: {
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(201, 166, 91, 0.10)',
    borderRadius: radius.md,
  },
  rank: { width: 26, textAlign: 'center' },
  info: { flex: 1, gap: 1 },
  right: { alignItems: 'flex-end', gap: 2 },
  movement: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  gap: { paddingVertical: spacing.xs },
});
