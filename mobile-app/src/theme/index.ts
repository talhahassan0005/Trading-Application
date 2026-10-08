import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { create } from 'zustand';
import { Palette, darkPalette, lightPalette } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

/** Runtime theme switch. Dark is the default. */
export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  toggle: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
  setMode: (mode) => set({ mode }),
}));

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  toggle: () => void;
}

export function useTheme(): Theme {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);
  return useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      colors: mode === 'dark' ? darkPalette : lightPalette,
      spacing,
      radius,
      typography,
      toggle,
    }),
    [mode, toggle],
  );
}

/**
 * Builds themed styles, recreated only when the theme changes. The factory
 * must depend on the theme alone (not on props/state), so it is deliberately
 * not part of the memo deps and may be written inline:
 *   const styles = useStyles((t) => ({ box: { backgroundColor: t.colors.card } }));
 */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
}

export { withAlpha } from './colors';
export type { Palette } from './colors';
