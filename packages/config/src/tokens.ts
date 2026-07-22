/**
 * Challenge42 design tokens — the single source of truth for the visual system.
 *
 * Framework-agnostic: plain data consumed by the mobile theme (React Native) and the admin app.
 * Components must never hardcode hex/size/spacing — always read from here (or the mobile theme
 * that wraps these). See `docs/DESIGN_SYSTEM.md` for intent and rules.
 *
 * Rebranding = editing values in this file + `brand.ts`. No component changes required.
 */

/** Raw brand palette. Original identity — not derived from any existing brand. */
export const palette = {
  deepPine: '#12382B',
  warmCream: '#F7F3E8',
  softWhite: '#FCFBF7',
  warmGold: '#C9A65B',
  charcoal: '#222822',
  liveAccent: '#D74A43',

  // Supporting naturals (kept close to the core identity)
  pineTint: '#1C4A38', // lighter pine for gradients/hover on pine surfaces
  goldTint: '#DFC48A',
  cardSunken: '#F1ECDD', // a hair darker than cream for grouped rows
} as const;

/**
 * Semantic color tokens. Components reference these, not the raw palette, so meaning stays stable
 * even if a hue changes. Opacity variants use rgba() strings (valid in RN and CSS).
 */
export const colors = {
  text: {
    primary: palette.charcoal,
    secondary: 'rgba(34, 40, 34, 0.62)',
    tertiary: 'rgba(34, 40, 34, 0.42)',
    onPine: palette.warmCream,
    onPineMuted: 'rgba(247, 243, 232, 0.72)',
    onGold: palette.charcoal,
    inverse: palette.softWhite,
  },
  surface: {
    background: palette.warmCream,
    card: palette.softWhite,
    sunken: palette.cardSunken,
    pine: palette.deepPine,
    pineElevated: palette.pineTint,
    gold: palette.warmGold,
  },
  border: {
    hairline: 'rgba(34, 40, 34, 0.10)',
    strong: 'rgba(34, 40, 34, 0.18)',
    onPine: 'rgba(247, 243, 232, 0.16)',
  },
  brand: {
    pine: palette.deepPine,
    gold: palette.warmGold,
    live: palette.liveAccent,
  },
  status: {
    online: '#33B96A', // illuminated presence green
    live: palette.liveAccent,
    positive: '#2F8F5B', // healthy progress (e.g. weight moving toward goal)
    warning: '#C9922F',
    danger: '#B23B34',
    info: '#3E6B8C',
  },
  /** Restrained accents for activity status dots / pulse rows. */
  activity: {
    running: '#C56A2E',
    walking: '#4B8A6E',
    workout: '#8A5A9E',
    cycling: '#3E7CA8',
    yoga: '#8A7BB0',
    hiit: '#C7503F',
    sports: '#5A7D3A',
    other: '#6B6B63',
  },
  overlay: {
    scrim: 'rgba(18, 56, 43, 0.48)',
  },
} as const;

/** Spacing scale on a 4pt base. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

/** Corner radii. Not everything is a pill — rows often use hairlines with no radius. */
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Border widths. `hairline` is resolved to StyleSheet.hairlineWidth in the mobile theme. */
export const borderWidth = {
  hairline: 1,
  thin: 1,
  thick: 2,
} as const;

export type TypographyRole = 'display' | 'ui';

export interface TypeStyle {
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: '400' | '500' | '600' | '700' | '800';
  readonly letterSpacing: number;
  /** 'display' → editorial/serif face; 'ui' → legible sans. Mobile theme maps role → fontFamily. */
  readonly role: TypographyRole;
  readonly uppercase?: boolean;
}

/**
 * Type scale. Every large number must be paired with a small label in the UI (design rule).
 * Minimum functional text size is 13 (`label.md`); `label.sm` is reserved for uppercase eyebrows.
 */
export const typography = {
  displayXl: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '700',
    letterSpacing: -1,
    role: 'display',
  },
  displayLg: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.5,
    role: 'display',
  },
  displayMd: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.25,
    role: 'display',
  },
  titleLg: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.2, role: 'ui' },
  titleMd: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.1, role: 'ui' },
  bodyLg: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: 0, role: 'ui' },
  bodyMd: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 0, role: 'ui' },
  labelMd: { fontSize: 13, lineHeight: 16, fontWeight: '600', letterSpacing: 0.2, role: 'ui' },
  labelSm: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1,
    role: 'ui',
    uppercase: true,
  },
} as const satisfies Record<string, TypeStyle>;

/** Soft, single-layer elevation. Used only where a surface must truly float. */
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  card: {
    shadowColor: palette.charcoal,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  raised: {
    shadowColor: palette.charcoal,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;

/** Layout constants. iPhone-first; no desktop assumptions. */
export const layout = {
  screenGutter: spacing.xl, // 20
  cardPadding: spacing.lg, // 16
  blockGap: spacing['2xl'], // 24 between major Home blocks
  minTouchTarget: 44,
  quickActionHeight: 60,
  maxContentWidth: 560, // used by admin/web; mobile ignores (full-bleed within gutters)
} as const;

/** Motion tokens. Restrained and purposeful (see DESIGN_SYSTEM §6). */
export const motion = {
  duration: {
    micro: 120,
    standard: 240,
    entrance: 320,
    pulse: 1600,
  },
  // Cubic-bezier control points; consumed by Reanimated Easing / CSS.
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    easeOut: [0, 0, 0.2, 1] as const,
    easeIn: [0.4, 0, 1, 1] as const,
  },
} as const;

export const tokens = {
  palette,
  colors,
  spacing,
  radius,
  borderWidth,
  typography,
  elevation,
  layout,
  motion,
} as const;

export type Tokens = typeof tokens;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TypographyToken = keyof typeof typography;
export type ColorStatus = keyof typeof colors.status;
export type ActivityColor = keyof typeof colors.activity;
