import type { ReactNode } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { spacing } from '@challenge42/config';
import { Text } from './Text';

export interface SectionProps {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  style?: ViewStyle;
}

/** A titled content block with an optional eyebrow and a trailing action link. */
export function Section({
  title,
  eyebrow,
  actionLabel,
  onAction,
  children,
  style,
}: SectionProps): React.JSX.Element {
  return (
    <View style={style}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          {eyebrow ? (
            <Text variant="labelSm" color="tertiary" style={styles.eyebrow}>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="titleMd">{title}</Text>
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}
          >
            <Text variant="labelMd" color="gold">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleWrap: { flexShrink: 1 },
  eyebrow: { marginBottom: spacing.xs },
  body: { marginTop: spacing.md },
  pressed: { opacity: 0.6 },
});
