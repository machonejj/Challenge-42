import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, radius, spacing } from '@challenge42/config';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { LiveDot } from '@/components/ui/LiveDot';
import { USPresenceMap } from '@/components/live/USPresenceMap';
import { mockPresence, SUBMISSION_META } from '@/features/live/mockPresence';

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
  const onlineCount = mockPresence.filter((d) => d.online).length;
  const submissions = mockPresence.filter((d) => d.submission);

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
          {onlineCount} challengers online right now. Locations are approximate — city-level only.
        </Text>

        <Card style={styles.mapCard}>
          <Text variant="labelSm" color="tertiary" style={styles.mapTitle}>
            WHERE CHALLENGERS ARE TODAY
          </Text>
          <View style={styles.mapWrap}>
            <USPresenceMap dots={mockPresence} />
          </View>
          <View style={styles.legend}>
            <LegendItem swatch={<LiveDot size={9} />} label="Online" />
            <LegendItem swatch={<View style={styles.offlineSwatch} />} label="Offline" />
            <LegendItem swatch={<View style={styles.postedSwatch} />} label="Posted today" />
          </View>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          POSTED TODAY
        </Text>
        <Card padded={false}>
          <View style={styles.list}>
            {submissions.map((d, i) => {
              const meta = SUBMISSION_META[d.submission!.kind];
              return (
                <View key={d.id}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.row}>
                    <Text style={styles.emoji}>{meta.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="labelMd" numberOfLines={1}>
                        {d.name} · {d.city}, {d.state}
                      </Text>
                      <Text variant="bodyMd" color="secondary" numberOfLines={1}>
                        {meta.label} · {d.submission!.label}
                      </Text>
                    </View>
                    {d.online ? <LiveDot size={8} /> : <View style={styles.offlineSwatch} />}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.teaser}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyLg">Leaderboard</Text>
            <Text variant="bodyMd" color="secondary">
              Weight lost, ranked by % of body weight — the healthy way to compete.
            </Text>
          </View>
          <Text variant="labelSm" color="tertiary">
            Next
          </Text>
        </Card>

        <Text variant="labelSm" color="tertiary" align="center" style={styles.demoNote}>
          Presence & submissions are demo data for now
        </Text>
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
  postedSwatch: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 166, 91, 0.12)',
  },
  sectionLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  emoji: { fontSize: 22 },
  teaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  demoNote: { marginTop: spacing['2xl'] },
});
