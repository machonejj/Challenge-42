import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, radius, spacing } from '@challenge42/config';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { LiveDot } from '@/components/ui/LiveDot';
import { USPresenceMap } from '@/components/live/USPresenceMap';
import { Leaderboard } from '@/components/live/Leaderboard';
import { useCommunity } from '@/features/live/community';

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <View style={styles.legendItem}>
      {swatch}
      <Text variant="labelSm" color="secondary">
        {label}
      </Text>
    </View>
  );
}

export default function LeaderboardScreen(): React.JSX.Element {
  const { rows, dots, onlineCount, totalCount, isReal } = useCommunity();

  return (
    <>
      <StatusBar style="dark" />
      <ScreenScaffold>
        <Text variant="labelSm" color="gold">
          LEADERBOARD
        </Text>
        <Text variant="titleLg" style={styles.title}>
          Ranked by % of body weight
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          Everyone competes on equal footing — percentage, never raw pounds. The healthy way to
          compete.
        </Text>

        <View style={styles.board}>
          <Leaderboard rows={rows} />
        </View>

        {!isReal && totalCount <= 1 ? (
          <Text variant="labelSm" color="tertiary" align="center" style={styles.note}>
            As challengers join and sync, they’ll appear on the board.
          </Text>
        ) : null}

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          WHERE CHALLENGERS ARE
        </Text>
        <Card>
          <Text variant="bodyMd" color="secondary" style={styles.mapCaption}>
            {totalCount === 0
              ? 'Enroll and weigh in to appear on the map.'
              : `${onlineCount} of ${totalCount} active today · state-level only.`}
          </Text>
          <View style={styles.mapWrap}>
            <USPresenceMap dots={dots} />
          </View>
          <View style={styles.legend}>
            <LegendItem swatch={<LiveDot size={9} />} label="Active today" />
            <LegendItem swatch={<View style={styles.offlineSwatch} />} label="Resting" />
          </View>
        </Card>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  subtitle: { marginTop: spacing.sm },
  board: { marginTop: spacing.xl },
  note: { marginTop: spacing.lg },
  sectionLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  mapCaption: { marginBottom: spacing.md },
  mapWrap: { alignItems: 'center' },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  offlineSwatch: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.text.tertiary,
  },
});
