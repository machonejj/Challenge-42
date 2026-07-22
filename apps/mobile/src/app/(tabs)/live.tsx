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

export default function LiveScreen(): React.JSX.Element {
  const { rows, dots, onlineCount, totalCount, isReal } = useCommunity();

  const presence =
    totalCount === 0
      ? 'Enroll and weigh in to appear on the board.'
      : isReal
        ? `${onlineCount} of ${totalCount} challengers active today.`
        : "You're on the board. As challengers join, they'll appear here.";

  return (
    <>
      <StatusBar style="dark" />
      <ScreenScaffold>
        <Text variant="labelSm" color="gold">
          LIVE
        </Text>
        <Text variant="titleLg" style={styles.title}>
          The challenge, live
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          {presence} Locations are approximate — state-level only.
        </Text>

        <Card style={styles.mapCard}>
          <Text variant="labelSm" color="tertiary" style={styles.mapTitle}>
            WHERE CHALLENGERS ARE
          </Text>
          <View style={styles.mapWrap}>
            <USPresenceMap dots={dots} />
          </View>
          <View style={styles.legend}>
            <LegendItem swatch={<LiveDot size={9} />} label="Active today" />
            <LegendItem swatch={<View style={styles.offlineSwatch} />} label="Resting" />
          </View>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          LEADERBOARD
        </Text>
        <Text variant="titleMd" style={styles.lbTitle}>
          Ranked by % of body weight
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.lbBlurb}>
          Everyone competes on equal footing — percentage, never raw pounds. The healthy way to
          compete.
        </Text>

        <View style={styles.lbWrap}>
          <Leaderboard rows={rows} />
        </View>

        {!isReal ? (
          <Text variant="labelSm" color="tertiary" align="center" style={styles.note}>
            More challengers appear here as they join and sync.
          </Text>
        ) : null}
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  subtitle: { marginTop: spacing.sm },
  mapCard: { marginTop: spacing.xl },
  mapTitle: { marginBottom: spacing.md },
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
  sectionLabel: { marginTop: spacing['2xl'] },
  lbTitle: { marginTop: spacing.xs },
  lbBlurb: { marginTop: spacing.xs },
  lbWrap: { marginTop: spacing.lg },
  note: { marginTop: spacing.xl },
});
