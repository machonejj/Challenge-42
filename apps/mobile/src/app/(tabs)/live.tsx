import { View, StyleSheet } from 'react-native';
import { spacing } from '@challenge42/config';
import { PlaceholderScreen } from '@/features/placeholders/PlaceholderScreen';
import { Text } from '@/components/ui/Text';
import { LeaderboardPreview } from '@/components/live/LeaderboardPreview';
import { mockTopLeaders, mockCurrentUserEntry } from '@/features/live/mockLeaderboard';

export default function LiveScreen(): React.JSX.Element {
  return (
    <PlaceholderScreen
      eyebrow="LIVE"
      title="The challenge, live"
      description="Leaderboard, a privacy-safe map, and a live feed of milestones and wins — the feeling that something is happening right now."
      phaseLabel="Arriving Phases 4–7"
      teaser={
        <View>
          <Text variant="labelSm" color="tertiary" style={styles.teaserLabel}>
            LEADERBOARD · PREVIEW
          </Text>
          <LeaderboardPreview top={mockTopLeaders} currentUser={mockCurrentUserEntry} />
          <Text variant="labelSm" color="tertiary" align="center" style={styles.demo}>
            Ranks reward healthy consistency — not most pounds lost. Demo data.
          </Text>
        </View>
      }
      features={[
        {
          icon: 'podium-outline',
          label: 'Leaderboard',
          description:
            'Overall, consistency, streak, and % change — with your sticky rank and next target.',
        },
        {
          icon: 'map-outline',
          label: 'Live Map',
          description:
            'Approximate, opt-in locations with online presence. Never exact addresses or routes.',
        },
        {
          icon: 'radio-outline',
          label: 'Live Feed',
          description: 'Milestones, wins, shared meals, completed activities, and team events.',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  teaserLabel: { marginBottom: spacing.sm },
  demo: { marginTop: spacing.md },
});
