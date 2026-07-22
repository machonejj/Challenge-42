import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { colors, type TypographyToken } from '@challenge42/config';
import { typeStyle } from '@/theme/theme';

const TEXT_COLORS = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
  onPine: colors.text.onPine,
  onPineMuted: colors.text.onPineMuted,
  onGold: colors.text.onGold,
  gold: colors.brand.gold,
  live: colors.brand.live,
  positive: colors.status.positive,
  danger: colors.status.danger,
} as const;

export type TextColor = keyof typeof TEXT_COLORS;

export interface TextProps extends RNTextProps {
  variant?: TypographyToken;
  color?: TextColor;
  align?: TextStyle['textAlign'];
}

/**
 * The single text primitive. Enforces the type scale + semantic colors from the design system so no
 * screen hardcodes font sizes or hex values.
 */
export function Text({
  variant = 'bodyMd',
  color = 'primary',
  align,
  style,
  ...rest
}: TextProps): React.JSX.Element {
  return (
    <RNText
      style={[
        typeStyle(variant),
        { color: TEXT_COLORS[color] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
