import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Row } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getAsset } from '../../data/assets';
import { useOpenPnl } from '../../hooks/useOpenPnl';
import { useTradesStore } from '../../store/trades';
import { useWalletStore } from '../../store/wallet';
import { useStyles, useTheme } from '../../theme';
import { money, signedMoney } from '../../utils/format';

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const styles = useStyles((t) => ({
    card: { flex: 1, minWidth: '45%', gap: t.spacing.xs },
    label: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    value: { ...t.typography.heading, color: t.colors.text, fontVariant: ['tabular-nums'] },
  }));
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color ? { color } : null]}>{value}</Text>
    </Card>
  );
}

export default function PortfolioScreen() {
  const { colors } = useTheme();
  const balance = useWalletStore((s) => s.balances[s.mode]);
  const positions = useTradesStore((s) => s.positions);
  const openPnl = useOpenPnl();

  const { history, winRate } = useMemo(() => {
    const closed = positions.filter((p) => p.status !== 'open');
    const wins = closed.filter((p) => p.status === 'won').length;
    const decided = closed.filter((p) => p.status !== 'push').length;
    return { history: closed, winRate: decided ? (wins / decided) * 100 : null };
  }, [positions]);

  const styles = useStyles((t) => ({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.xs },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.lg },
    divider: { height: 1, backgroundColor: t.colors.border },
  }));

  const pnlColor = openPnl > 0 ? colors.up : openPnl < 0 ? colors.down : undefined;

  return (
    <Screen>
      <ScreenHeader title="Portfolio" />
      <View style={styles.grid}>
        <Stat label="Balance" value={money(balance)} />
        <Stat label="Open P/L" value={signedMoney(openPnl)} color={pnlColor} />
        <Stat label="Win rate" value={winRate === null ? '—' : `${winRate.toFixed(0)}%`} />
        <Stat label="Trades" value={String(positions.length)} />
      </View>

      <Card>
        <Text style={styles.section}>Trade history</Text>
        {history.length === 0 ? (
          <Text style={styles.empty}>Settled trades will appear here.</Text>
        ) : (
          history.map((p, i) => {
            const color = p.status === 'won' ? colors.up : p.status === 'lost' ? colors.down : colors.muted;
            return (
              <View key={p.id}>
                {i > 0 && <View style={styles.divider} />}
                <Row
                  left={
                    <Ionicons
                      name={p.direction === 'up' ? 'arrow-up-circle' : 'arrow-down-circle'}
                      size={26}
                      color={p.direction === 'up' ? colors.up : colors.down}
                    />
                  }
                  title={p.symbol}
                  subtitle={`${money(p.stake)} · ${p.entry.toFixed(getAsset(p.symbol).decimals)} → ${(p.exit ?? p.entry).toFixed(getAsset(p.symbol).decimals)}`}
                  right={signedMoney(p.pnl ?? 0)}
                  rightColor={color}
                  rightSub={p.status.toUpperCase()}
                />
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}
