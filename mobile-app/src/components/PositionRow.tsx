import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAsset } from '../data/assets';
import { useLivePrice } from '../hooks/useLivePrice';
import { useNow } from '../hooks/useNow';
import { Position, projectedPnl } from '../store/trades';
import { useStyles, useTheme } from '../theme';
import { clock, money, signedMoney } from '../utils/format';

/** One open position: direction, entry, countdown to expiry and running P/L. */
export function PositionRow({ position }: { position: Position }) {
  const { colors } = useTheme();
  const now = useNow(500);
  const { price } = useLivePrice(position.symbol);
  const decimals = getAsset(position.symbol).decimals;
  const pnl = projectedPnl(position, price);
  const pnlColor = pnl > 0 ? colors.up : pnl < 0 ? colors.down : colors.muted;
  const dirColor = position.direction === 'up' ? colors.up : colors.down;

  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md },
    grow: { flex: 1, gap: 2 },
    sym: { ...t.typography.subheading, color: t.colors.text },
    sub: { ...t.typography.caption, color: t.colors.muted, fontVariant: ['tabular-nums'] },
    right: { alignItems: 'flex-end', gap: 2 },
    timer: { ...t.typography.mono, color: t.colors.text },
    pnl: { ...t.typography.label, fontWeight: '700', fontVariant: ['tabular-nums'] },
  }));

  return (
    <View style={styles.row}>
      <Ionicons name={position.direction === 'up' ? 'arrow-up-circle' : 'arrow-down-circle'} size={28} color={dirColor} />
      <View style={styles.grow}>
        <Text style={styles.sym}>{position.symbol}</Text>
        <Text style={styles.sub}>
          {money(position.stake)} @ {position.entry.toFixed(decimals)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.timer}>{clock((position.expiresAt - now) / 1000)}</Text>
        <Text style={[styles.pnl, { color: pnlColor }]}>{signedMoney(pnl)}</Text>
      </View>
    </View>
  );
}
