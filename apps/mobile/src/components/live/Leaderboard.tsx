import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@challenge42/config';
import type { LeaderRow } from '@/features/live/community';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Divider } from '@/components/ui/Divider';
import { LiveDot } from '@/components/ui/LiveDot';

const MEDAL = ['#C9A65B', '#B9BDC4', '#C08457']; // gold / silver / bronze for ranks 1–3

function Rank({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <View style={[styles.medal, { backgroundColor: MEDAL[rank - 1] }]}>
        <Text variant="labelSm" style={styles.medalText}>
          {rank}
        </Text>
      </View>
    );
  }
  return (
    <Text variant="labelMd" color="tertiary" style={styles.rankNum}>
      {rank}
    </Text>
  );
}

function pctText(pct: number): string {
  if (pct > 0) return `${pct.toFixed(1)}%`;
  if (pct < 0) return `+${Math.abs(pct).toFixed(1)}%`; // gained
  return '—';
}

function Row({ entry }: { entry: LeaderRow }) {
  const lost = entry.pctLost > 0;
  return (
    <View style={[styles.row, entry.isCurrentUser && styles.currentRow]}>
      <Rank rank={entry.rank} />
      <Avatar name={entry.name} size={36} tone={entry.isCurrentUser ? 'gold' : 'pine'} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="labelMd" numberOfLines={1} style={styles.name}>
            {entry.name}
          </Text>
          {entry.isCurrentUser ? (
            <View style={styles.youPill}>
              <Text variant="labelSm" style={styles.youText}>
                YOU
              </Text>
            </View>
          ) : null}
          {entry.activeRecent ? <LiveDot size={7} /> : null}
        </View>
        <Text variant="labelSm" color="tertiary" numberOfLines={1}>
          {entry.state ?? '—'}
        </Text>
      </View>
      <View style={styles.right}>
        <Text
          variant="titleMd"
          style={{ color: lost ? colors.status.positive : colors.text.tertiary }}
        >
          {pctText(entry.pctLost)}
        </Text>
        <Text variant="labelSm" color="tertiary">
          lost
        </Text>
      </View>
    </View>
  );
}

/** A clear, honest leaderboard ranked by % of body weight lost. Highlights the signed-in user. */
export function Leaderboard({ rows }: { rows: readonly LeaderRow[] }): React.JSX.Element {
  if (rows.length === 0) {
    return (
      <Card>
        <Text variant="bodyMd" color="secondary" align="center">
          The board fills in once you enroll and log your first weigh-in.
        </Text>
      </Card>
    );
  }
  return (
    <Card padded={false}>
      <View style={styles.list}>
        {rows.map((entry, i) => (
          <View key={entry.userId}>
            {i > 0 ? <Divider /> : null}
            <Row entry={entry} />
          </View>
        ))}
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
  medal: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalText: { color: '#1C1A15', fontWeight: '700' },
  rankNum: { width: 26, textAlign: 'center' },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1 },
  youPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.gold,
  },
  youText: { color: '#1C1A15', fontWeight: '700', fontSize: 9, letterSpacing: 0.5 },
  right: { alignItems: 'flex-end', minWidth: 52 },
});
