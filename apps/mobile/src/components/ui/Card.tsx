import { View, type ViewProps, StyleSheet } from 'react-native';
import { colors, radius, spacing, elevation } from '@challenge42/config';

export interface CardProps extends ViewProps {
  tone?: 'card' | 'pine' | 'sunken';
  padded?: boolean;
  elevated?: boolean;
}

/** Base surface. Defined by a hairline border (not heavy shadow), per the design system. */
export function Card({
  tone = 'card',
  padded = true,
  elevated = false,
  style,
  ...rest
}: CardProps): React.JSX.Element {
  const bg =
    tone === 'pine'
      ? colors.surface.pine
      : tone === 'sunken'
        ? colors.surface.sunken
        : colors.surface.card;
  const borderColor = tone === 'pine' ? colors.border.onPine : colors.border.hairline;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bg, borderColor },
        padded && styles.padded,
        elevated && elevation.card,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: spacing.lg,
  },
});
