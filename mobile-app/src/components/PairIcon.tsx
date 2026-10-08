import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../theme';

/** Glyph shown in each icon circle: flags for currencies, symbols for crypto/commodities. */
const GLYPHS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', AUD: '🇦🇺', CAD: '🇨🇦',
  BTC: '₿', ETH: 'Ξ', SOL: '◎', XRP: '✕',
  XAU: '🥇', XAG: '🥈', WTI: '🛢️',
};

/** "EUR/USD" -> ['🇪🇺', '🇺🇸']; "AAPL" -> ['A']; "WTI Oil" -> ['🛢️'] */
export function pairGlyphs(symbol: string): string[] {
  const parts = symbol.split('/');
  const first = parts[0].split(' ')[0];
  if (parts.length === 2) {
    // Metals trade against USD; show just the metal.
    if (first === 'XAU' || first === 'XAG') return [GLYPHS[first]];
    return [GLYPHS[first] ?? first[0], GLYPHS[parts[1]] ?? parts[1][0]];
  }
  return [GLYPHS[first] ?? first[0]];
}

/** One or two overlapping circular icons for an instrument. */
export function PairIcon({ symbol, size = 22 }: { symbol: string; size?: number }) {
  const glyphs = pairGlyphs(symbol);
  const overlap = size * 0.55;
  const styles = useStyles((t) => ({
    dot: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: t.colors.surface,
      backgroundColor: t.colors.card,
    },
    glyph: { color: t.colors.text, fontWeight: '800' },
  }));
  return (
    <View style={{ width: size + overlap * (glyphs.length - 1), height: size }}>
      {glyphs.map((g, i) => (
        <View
          key={i}
          style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }, i > 0 && { position: 'absolute', left: overlap * i }]}
        >
          <Text style={[styles.glyph, { fontSize: size * 0.55 }]}>{g}</Text>
        </View>
      ))}
    </View>
  );
}
