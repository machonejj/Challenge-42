/**
 * The mobile theme. Maps the framework-agnostic tokens from `@challenge42/config` into a
 * React-Native-friendly shape: resolves the display/ui font families per platform, exposes the
 * hairline width, and provides `typeStyle()` to turn a typography token into a concrete text style.
 *
 * Components read from here (or the `Text`/`useTheme` wrappers) — never hardcoded values.
 * Phase One is light-only; keeping this as a resolved object (behind `useTheme`) means dark mode
 * later is an additive change, not a rewrite.
 */
import { Platform, StyleSheet, type TextStyle } from 'react-native';
import {
  borderWidth,
  colors,
  elevation,
  layout,
  motion,
  radius,
  spacing,
  typography,
  type TypographyToken,
} from '@challenge42/config';

const fontFamily = {
  // Editorial serif for hero moments. Uses platform serifs in Phase One (no bundled font).
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  // Highly legible system sans for functional UI (undefined => platform default).
  ui: Platform.select<string | undefined>({
    ios: undefined,
    android: undefined,
    default: undefined,
  }),
} as const;

export function typeStyle(token: TypographyToken): TextStyle {
  const t = typography[token];
  const family = t.role === 'display' ? fontFamily.display : fontFamily.ui;
  return {
    fontSize: t.fontSize,
    lineHeight: t.lineHeight,
    fontWeight: t.fontWeight,
    letterSpacing: t.letterSpacing,
    ...(family ? { fontFamily: family } : null),
    ...('uppercase' in t && t.uppercase ? { textTransform: 'uppercase' as const } : null),
  };
}

export const theme = {
  colors,
  spacing,
  radius,
  borderWidth,
  elevation,
  layout,
  motion,
  fontFamily,
  hairline: StyleSheet.hairlineWidth,
  typeStyle,
} as const;

export type Theme = typeof theme;
