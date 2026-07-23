import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';

export interface WeighInStatusProps {
  done: boolean;
  streak: number;
  todayDisplay?: string | null; // e.g. "251 lb"
  onPress: () => void;
}

/**
 * The daily weigh-in nudge: an unmistakable "not done yet" prompt that turns into a rewarding,
 * checked-off card once today's weight is logged.
 */
export function WeighInStatus({
  done,
  streak,
  todayDisplay,
  onPress,
}: WeighInStatusProps): React.JSX.Element {
  if (done) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.card, styles.doneCard]}
        accessibilityRole="button"
        accessibilityLabel="Weighed in today. Tap to update."
      >
        <View style={[styles.iconWrap, styles.doneIcon]}>
          <Ionicons name="checkmark" size={22} color={colors.text.onPine} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="labelMd" style={{ color: colors.status.positive }}>
            Weighed in today ✓
          </Text>
          <Text variant="labelSm" color="secondary">
            {todayDisplay ? `Logged ${todayDisplay}` : 'Nice work — that keeps your trend honest.'}
            {streak > 1 ? ` · 🔥 ${streak}-day streak` : ''}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, styles.todoCard]}
      accessibilityRole="button"
      accessibilityLabel="Today's weigh-in is not done. Tap to weigh in."
    >
      <View style={[styles.iconWrap, styles.todoIcon]}>
        <Ionicons name="scale-outline" size={22} color={colors.brand.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="labelMd">Today’s weigh-in</Text>
        <Text variant="labelSm" color="secondary">
          {streak > 0
            ? `Not logged yet — keep your ${streak}-day streak going.`
            : 'Not logged yet — takes 5 seconds.'}
        </Text>
      </View>
      <View style={styles.cta}>
        <Text variant="labelSm" style={{ color: colors.text.onPine }}>
          Weigh in
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  todoCard: {
    backgroundColor: 'rgba(201, 166, 91, 0.10)',
    borderColor: 'rgba(201, 166, 91, 0.45)',
  },
  doneCard: {
    backgroundColor: 'rgba(47, 143, 91, 0.08)',
    borderColor: 'rgba(47, 143, 91, 0.30)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoIcon: { backgroundColor: 'rgba(201, 166, 91, 0.18)' },
  doneIcon: { backgroundColor: colors.status.positive },
  cta: {
    backgroundColor: colors.brand.pine,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
