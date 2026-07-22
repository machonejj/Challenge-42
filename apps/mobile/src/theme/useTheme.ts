import { theme, type Theme } from './theme';

/**
 * Access the theme. Phase One returns the single light theme; the hook shape is stable so a future
 * dark/dynamic theme is an internal change only.
 */
export function useTheme(): Theme {
  return theme;
}
