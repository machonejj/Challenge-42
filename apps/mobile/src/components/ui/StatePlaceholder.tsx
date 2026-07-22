import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { Text } from './Text';

export interface StatePlaceholderProps {
  kind: 'loading' | 'empty' | 'error';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

/** Shared, on-brand loading / empty / error state. Never a raw spinner-on-blank or stack trace. */
export function StatePlaceholder({
  kind,
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: StatePlaceholderProps): React.JSX.Element {
  if (kind === 'loading') {
    return (
      <View style={styles.wrap} accessibilityRole="progressbar" accessibilityLabel="Loading">
        <ActivityIndicator color={colors.brand.pine} />
        {title ? (
          <Text variant="bodyMd" color="secondary" align="center" style={styles.gap}>
            {title}
          </Text>
        ) : null}
      </View>
    );
  }

  const defaultIcon = kind === 'error' ? 'cloud-offline-outline' : 'sparkles-outline';
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon ?? defaultIcon} size={26} color={colors.brand.pine} />
      </View>
      {title ? (
        <Text variant="titleMd" align="center" style={styles.gap}>
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text variant="bodyMd" color="secondary" align="center" style={styles.messageGap}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text variant="labelMd" color="onPine">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18, 56, 43, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap: { marginTop: spacing.lg },
  messageGap: { marginTop: spacing.sm, maxWidth: 320 },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.brand.pine,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  buttonPressed: { opacity: 0.85 },
});
