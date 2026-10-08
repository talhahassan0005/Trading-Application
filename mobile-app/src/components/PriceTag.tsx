import React from 'react';
import { Text, View } from 'react-native';
import { useStyles, useTheme } from '../theme';
import { percent } from '../utils/format';

interface Props {
  price: number;
  change: number; // percent
  decimals: number;
  size?: 'lg' | 'md';
}

/** Price with a green/red % change chip. */
export function PriceTag({ price, change, decimals, size = 'md' }: Props) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    price: { ...t.typography.mono, color: t.colors.text },
    priceLg: { fontSize: 26, fontWeight: '800' },
    change: { ...t.typography.label, fontVariant: ['tabular-nums'] },
  }));
  const color = change >= 0 ? colors.up : colors.down;
  return (
    <View style={styles.row}>
      <Text style={[styles.price, size === 'lg' && styles.priceLg]}>{price.toFixed(decimals)}</Text>
      <Text style={[styles.change, { color }]}>{percent(change)}</Text>
    </View>
  );
}
