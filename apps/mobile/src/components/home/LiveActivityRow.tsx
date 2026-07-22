import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { formatElapsed } from '@challenge42/domain';
import type { LiveActivityItem } from '@challenge42/types';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { presence, isTimedActivity } from '@/lib/activityPresentation';
import { useElapsedSeconds } from '@/lib/useElapsedSeconds';

/**
 * One live participant. Shows name, status, and a live-ticking timer or a distance detail.
 * Deliberately shows NO location or route — only status + title + progress.
 */
export function LiveActivityRow({
  item,
  onCheer,
}: {
  item: LiveActivityItem;
  onCheer?: (item: LiveActivityItem) => void;
}): React.JSX.Element {
  const p = presence(item.status);
  const timed = isTimedActivity(item.status) && item.startedAt !== null;
  const elapsed = useElapsedSeconds(timed ? item.startedAt : null);
  const detail = timed ? `${formatElapsed(elapsed)} elapsed` : item.detail;

  const handleCheer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onCheer?.(item);
  };

  return (
    <View style={styles.row}>
      <Avatar name={item.displayName} size={38} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text variant="labelMd" numberOfLines={1} style={styles.name}>
            {item.displayName}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: p.color }]} />
          <Text variant="labelSm" style={{ color: p.color }}>
            {p.label}
          </Text>
        </View>
        <Text variant="bodyMd" color="secondary" numberOfLines={1}>
          {item.title} · {detail}
        </Text>
      </View>
      <Pressable
        onPress={handleCheer}
        accessibilityRole="button"
        accessibilityLabel={`Cheer ${item.displayName}`}
        hitSlop={8}
        style={({ pressed }) => [styles.cheer, pressed && styles.cheerPressed]}
      >
        <Ionicons name="flame-outline" size={18} color={colors.brand.live} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  body: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1 },
  statusDot: { width: 6, height: 6, borderRadius: radius.pill, marginLeft: 2 },
  cheer: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(215, 74, 67, 0.08)',
  },
  cheerPressed: { opacity: 0.6 },
});
