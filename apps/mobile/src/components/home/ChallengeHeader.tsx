import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { brand, colors, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';

export interface ChallengeHeaderProps {
  challengeName: string;
  dayNumber: number;
  totalDays: number;
  streakDays: number;
  greetingName: string;
  onPressAvatar?: () => void;
}

function greeting(): string {
  // Deterministic-enough greeting without a clock dependency in shared code; the header is a UI leaf.
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Pine hero band: brand mark, Day X of 42, streak, greeting, and the avatar/settings entry point. */
export function ChallengeHeader({
  challengeName,
  dayNumber,
  totalDays,
  streakDays,
  greetingName,
  onPressAvatar,
}: ChallengeHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const progress = Math.max(0, Math.min(1, dayNumber / totalDays));

  return (
    <View style={[styles.band, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topRow}>
        <View style={styles.lockup}>
          <Text variant="labelSm" style={{ color: colors.brand.gold }}>
            {brand.name.toUpperCase()}
          </Text>
          <Text variant="bodyMd" style={{ color: colors.text.onPineMuted }}>
            {challengeName}
          </Text>
        </View>

        <View style={styles.streak}>
          <Ionicons name="flame" size={16} color={colors.brand.gold} />
          <Text variant="labelMd" style={{ color: colors.text.onPine }}>
            {streakDays} day streak
          </Text>
        </View>

        <Pressable
          onPress={onPressAvatar}
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
          hitSlop={8}
        >
          <Avatar name={greetingName} size={40} tone="gold" />
        </Pressable>
      </View>

      <View style={styles.dayRow}>
        <Text variant="displayMd" style={{ color: colors.text.onPine }}>
          Day {dayNumber}
        </Text>
        <Text variant="titleMd" style={{ color: colors.text.onPineMuted, marginBottom: 4 }}>
          {' '}
          of {totalDays}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      <Text variant="bodyLg" style={{ color: colors.text.onPine, marginTop: spacing.lg }}>
        {greeting()}, {greetingName.split(' ')[0]}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.surface.pine,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lockup: { flexShrink: 1, gap: 2 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(247, 243, 232, 0.10)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.xl,
  },
  track: {
    marginTop: spacing.md,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(247, 243, 232, 0.14)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.brand.gold,
  },
});
