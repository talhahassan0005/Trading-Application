/** Color tokens. Every color in the app must come from one of these palettes. */
export interface Palette {
  page: string; // screen background
  surface: string; // bars, inputs, raised areas
  card: string; // cards
  border: string;
  text: string;
  muted: string;
  accent: string;
  up: string;
  down: string;
  warn: string;
  onAccent: string; // text/icon color on top of accent/up/down fills
}

export const darkPalette: Palette = {
  page: '#0B0F17',
  surface: '#111726',
  card: '#171F31',
  border: '#26304A',
  text: '#E8ECF4',
  muted: '#8A94A8',
  accent: '#378ADD',
  up: '#1D9E75',
  down: '#c0392b',
  warn: '#EF9F27',
  onAccent: '#FFFFFF',
};

export const lightPalette: Palette = {
  page: '#F2F4F8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#DCE1EB',
  text: '#131A2A',
  muted: '#667085',
  accent: '#378ADD',
  up: '#1D9E75',
  down: '#c0392b',
  warn: '#EF9F27',
  onAccent: '#FFFFFF',
};

/** Returns `hex` (#RRGGBB) with the given alpha (0..1) — for tinted fills derived from tokens. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
