import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../theme';

import { getAsset } from '../data/assets';

/** Crypto symbols; everything else falls back to a flag (currencies) or first letter. */
const CRYPTO_GLYPHS: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', SOL: '◎', XRP: '✕', LTC: 'Ł', DOGE: 'Ð', ADA: '₳', BCH: 'Ƀ', TRX: 'T', DOT: '●',
};

/** Currency codes whose first two letters aren't their country code. */
const CURRENCY_COUNTRY: Record<string, string> = { EUR: 'EU', CNH: 'CN', XAU: '', XAG: '' };

/** "PKR" -> 🇵🇰 (ISO 4217 codes start with the ISO 3166 country code). */
function currencyFlag(code: string): string | null {
  if (!/^[A-Z]{3}$/.test(code)) return null;
  const cc = CURRENCY_COUNTRY[code] ?? code.slice(0, 2);
  if (!cc) return null;
  return String.fromCodePoint(...[...cc].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** "EUR/USD" -> ['🇪🇺', '🇺🇸']; "BTC/USD" -> ['₿']; "AAPL" -> ['A']; "US500" -> ['🇺🇸'] */
export function pairGlyphs(symbol: string): string[] {
  const asset = getAsset(symbol);
  if (asset.symbol === symbol && asset.icon) return [asset.icon];
  const [base, quote] = symbol.split('/');
  if (asset.symbol === symbol && asset.category === 'Crypto') return [CRYPTO_GLYPHS[base] ?? base[0]];
  if (quote) return [currencyFlag(base) ?? base[0], currencyFlag(quote) ?? quote[0]];
  return [symbol[0]];
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
