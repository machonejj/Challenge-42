import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@challenge42/config';
import type { HomeTeamSummary } from '@challenge42/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { LiveDot } from '@/components/ui/LiveDot';

/** Team summary: standing, online members, and today's size-normalized team goal. */
export function TeamStandingCard({ team }: { team: HomeTeamSummary }): React.JSX.Element {
  const goalPct = Math.round(Math.max(0, Math.min(1, team.goalProgress)) * 100);
  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.left}>
          <View style={[styles.crest, { backgroundColor: team.color }]} />
          <View style={{ flexShrink: 1 }}>
            <Text variant="titleMd" numberOfLines={1}>
              {team.name}
            </Text>
            <View style={styles.online}>
              <LiveDot size={8} />
              <Text variant="labelMd" color="secondary">
                {team.onlineCount} of {team.memberCount} online
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.standing}>
          <Text variant="labelSm" color="tertiary" align="right">
            STANDING
          </Text>
          <Text variant="displayMd" color="gold" align="right">
            #{team.standing}
          </Text>
          <Text variant="labelSm" color="tertiary" align="right">
            of {team.totalTeams}
          </Text>
        </View>
      </View>

      <View style={styles.goalRow}>
        <Text variant="labelMd" color="secondary">
          {team.goalLabel}
        </Text>
        <Text variant="labelMd" color="primary">
          {goalPct}%
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${goalPct}%`, backgroundColor: team.color }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  crest: { width: 34, height: 34, borderRadius: radius.sm },
  online: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 3 },
  standing: { alignItems: 'flex-end', gap: 0 },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
