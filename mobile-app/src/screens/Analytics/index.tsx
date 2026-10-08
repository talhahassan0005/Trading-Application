import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Card } from '../../components/Card';
import { DonutChart } from '../../components/DonutChart';
import { RangeBar } from '../../components/RangeBar';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTradesStore } from '../../store/trades';
import { useStyles, useTheme } from '../../theme';
import { money, signedMoney } from '../../utils/format';

// Distinct slice colors for the pairs donut — cycled if there are more than 5.
const DONUT_COLORS = ['#1D9E75', '#378ADD', '#F08A8A', '#B0203F', '#EF9F27'];

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

/** Analytics: charts built entirely from this account's own simulated trade history — no external data. */
export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const positions = useTradesStore((s) => s.positions);

  const stats = useMemo(() => {
    const closed = positions.filter((p) => p.status !== 'open');
    const decided = closed.filter((p) => p.status !== 'push');
    const wins = closed.filter((p) => p.status === 'won').length;
    const netPnl = closed.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
    const turnover = closed.reduce((sum, p) => sum + p.stake, 0);
    const winRate = decided.length ? (wins / decided.length) * 100 : null;
    const avgProfit = closed.length ? netPnl / closed.length : 0;

    // Oldest -> newest for the equity curve.
    const chrono = [...closed].reverse();
    let running = 0;
    const equity = chrono.map((p) => (running += p.pnl ?? 0));

    const byPair = new Map<string, number>();
    for (const p of closed) byPair.set(p.symbol, (byPair.get(p.symbol) ?? 0) + (p.pnl ?? 0));
    const pairs = [...byPair.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8);
    const maxAbsPair = Math.max(1, ...pairs.map(([, v]) => Math.abs(v)));
    const maxAbsEquity = Math.max(1, ...equity.map((v) => Math.abs(v)));

    const maxTradeProfit = closed.length ? Math.max(0, ...closed.map((p) => p.pnl ?? 0)) : 0;
    const topPositive = [...byPair.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topPositiveTotal = topPositive.reduce((sum, [, v]) => sum + v, 0);

    return { closed, winRate, netPnl, turnover, avgProfit, equity, pairs, maxAbsPair, maxAbsEquity, maxTradeProfit, topPositive, topPositiveTotal };
  }, [positions]);

  const styles = useStyles((t) => ({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.md },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.lg },
    sparkRow: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 3 },
    sparkBar: { flex: 1, borderRadius: 2, minHeight: 2 },
    sparkMid: { height: 1, backgroundColor: t.colors.border, marginBottom: 8 },
    pairRow: { gap: 4, marginBottom: t.spacing.md },
    pairHead: { flexDirection: 'row', justifyContent: 'space-between' },
    pairLabel: { ...t.typography.label, color: t.colors.text, fontWeight: '700' },
    pairValue: { ...t.typography.label, fontVariant: ['tabular-nums'] },
    barTrack: { height: 8, borderRadius: 4, backgroundColor: t.colors.surface, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4 },
    statLabel: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    statValue: { ...t.typography.heading, color: t.colors.text, fontVariant: ['tabular-nums'], marginBottom: t.spacing.md },
    donutRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
    legend: { flex: 1, gap: t.spacing.sm },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { ...t.typography.label, color: t.colors.text, flex: 1 },
    legendPct: { ...t.typography.label, color: t.colors.muted, fontVariant: ['tabular-nums'] },
  }));

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Analytics" subtitle="Built from your own trades in this demo" />

      <View style={styles.grid}>
        <Stat label="Trades" value={String(stats.closed.length)} />
        <Stat label="Win rate" value={stats.winRate === null ? '—' : `${stats.winRate.toFixed(0)}%`} />
        <Stat label="Net P/L" value={signedMoney(stats.netPnl)} color={stats.netPnl > 0 ? colors.up : stats.netPnl < 0 ? colors.down : undefined} />
        <Stat label="Avg profit / trade" value={signedMoney(stats.avgProfit)} color={stats.avgProfit > 0 ? colors.up : stats.avgProfit < 0 ? colors.down : undefined} />
        <Stat label="Net turnover" value={money(stats.turnover)} />
      </View>

      <Card>
        <Text style={styles.statLabel}>Max trade profit</Text>
        <Text style={styles.statValue}>{money(stats.maxTradeProfit)}</Text>
        <RangeBar value={stats.maxTradeProfit} bounds={[-1000, 0, 1000]} labels={['-1K–0', '0–1K', '+1K']} />
      </Card>

      <Card>
        <Text style={styles.section}>Top 5 most profitable pairs (your account)</Text>
        {stats.topPositive.length === 0 ? (
          <Text style={styles.empty}>No profitable pairs yet — win a few trades to see this fill in.</Text>
        ) : (
          <View style={styles.donutRow}>
            <DonutChart slices={stats.topPositive.map(([symbol, v], i) => ({ label: symbol, value: v, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} />
            <View style={styles.legend}>
              {stats.topPositive.map(([symbol, v], i) => (
                <View key={symbol} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }]} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {symbol}
                  </Text>
                  <Text style={styles.legendPct}>{((v / stats.topPositiveTotal) * 100).toFixed(0)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>

      <Card>
        <Text style={styles.section}>Equity curve (cumulative P/L)</Text>
        {stats.equity.length === 0 ? (
          <Text style={styles.empty}>Settle a few trades to see this fill in.</Text>
        ) : (
          <>
            <View style={styles.sparkMid} />
            <View style={styles.sparkRow}>
              {stats.equity.map((v, i) => (
                <View
                  key={i}
                  style={[
                    styles.sparkBar,
                    {
                      height: Math.max(2, (Math.abs(v) / stats.maxAbsEquity) * 90),
                      backgroundColor: v >= 0 ? colors.up : colors.down,
                      alignSelf: v >= 0 ? 'flex-end' : 'flex-start',
                    },
                  ]}
                />
              ))}
            </View>
          </>
        )}
      </Card>

      <Card>
        <Text style={styles.section}>P/L by pair</Text>
        {stats.pairs.length === 0 ? (
          <Text style={styles.empty}>No settled trades yet.</Text>
        ) : (
          stats.pairs.map(([symbol, pnl]) => {
            const color = pnl >= 0 ? colors.up : colors.down;
            return (
              <View key={symbol} style={styles.pairRow}>
                <View style={styles.pairHead}>
                  <Text style={styles.pairLabel}>{symbol}</Text>
                  <Text style={[styles.pairValue, { color }]}>{signedMoney(pnl)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(Math.abs(pnl) / stats.maxAbsPair) * 100}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })
        )}
      </Card>
    </Screen>
  );
}
