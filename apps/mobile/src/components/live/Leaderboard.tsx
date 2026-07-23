import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import type { LeaderRow } from '@/features/live/community';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Divider } from '@/components/ui/Divider';
import { LiveDot } from '@/components/ui/LiveDot';

const MEDAL = ['#C9A65B', '#B9BDC4', '#C08457']; // gold / silver / bronze

function pctText(pct: number): string {
  if (pct > 0) return `${pct.toFixed(1)}%`;
  if (pct < 0) return `+${Math.abs(pct).toFixed(1)}%`;
  return '0%';
}

function lbsText(lbs: number): string {
  if (lbs > 0) return `${lbs.toFixed(1)} lb`;
  if (lbs < 0) return `+${Math.abs(lbs).toFixed(1)} lb`; // gained
  return '0 lb';
}

/** One podium column (bigger + raised for 1st). */
function Podium({ entry }: { entry: LeaderRow }): React.JSX.Element {
  const first = entry.rank === 1;
  const size = first ? 76 : 60;
  return (
    <View style={[styles.podium, first && styles.podiumFirst]}>
      {first ? (
        <Ionicons name="trophy" size={18} color={colors.brand.gold} style={styles.crown} />
      ) : null}
      <View>
        <View style={[styles.ring, { borderColor: MEDAL[entry.rank - 1] }]}>
          <Avatar
            name={entry.name}
            uri={entry.avatarUrl}
            size={size}
            tone={entry.isCurrentUser ? 'gold' : 'pine'}
          />
        </View>
        <View style={[styles.rankBadge, { backgroundColor: MEDAL[entry.rank - 1] }]}>
          <Text variant="labelSm" style={styles.rankBadgeText}>
            {entry.rank}
          </Text>
        </View>
      </View>
      <Text variant="labelMd" numberOfLines={1} style={styles.podiumName}>
        {entry.isCurrentUser ? 'You' : entry.name}
      </Text>
      <Text variant="titleMd" style={{ color: colors.status.positive }}>
        {lbsText(entry.lbsLost)}
      </Text>
      <Text variant="labelSm" color="tertiary" numberOfLines={1}>
        {pctText(entry.pctLost)}
      </Text>
    </View>
  );
}

function Row({ entry }: { entry: LeaderRow }): React.JSX.Element {
  const lost = entry.pctLost > 0;
  return (
    <View style={[styles.row, entry.isCurrentUser && styles.currentRow]}>
      <Text variant="labelMd" color="tertiary" style={styles.rankNum}>
        {entry.rank}
      </Text>
      <Avatar
        name={entry.name}
        uri={entry.avatarUrl}
        size={38}
        tone={entry.isCurrentUser ? 'gold' : 'pine'}
      />
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
          {lbsText(entry.lbsLost)}
        </Text>
        <Text variant="labelSm" color="tertiary">
          {pctText(entry.pctLost)}
        </Text>
      </View>
    </View>
  );
}

/** A wonderful leaderboard: a top-3 podium with face photos, then the ranked list. */
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

  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  // Podium order: 2nd, 1st, 3rd (classic podium layout).
  const order = [top[1], top[0], top[2]].filter(Boolean) as LeaderRow[];

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.podiumRow}>
        {order.map((e) => (
          <Podium key={e.userId} entry={e} />
        ))}
      </View>

      {rest.length > 0 ? (
        <Card padded={false}>
          <View style={styles.list}>
            {rest.map((entry, i) => (
              <View key={entry.userId}>
                {i > 0 ? <Divider /> : null}
                <Row entry={entry} />
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  podium: { flex: 1, alignItems: 'center', gap: 2 },
  podiumFirst: { marginBottom: spacing.lg },
  crown: { marginBottom: 2 },
  ring: {
    borderWidth: 2.5,
    borderRadius: radius.pill,
    padding: 2,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.surface.background,
  },
  rankBadgeText: { color: '#1C1A15', fontWeight: '700', fontSize: 11 },
  podiumName: { marginTop: spacing.sm },

  list: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  currentRow: {
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(201, 166, 91, 0.10)',
    borderRadius: radius.md,
  },
  rankNum: { width: 22, textAlign: 'center' },
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
  right: { alignItems: 'flex-end', minWidth: 66 },
});
