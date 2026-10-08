import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PairIcon } from '../../components/PairIcon';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ASSETS } from '../../data/assets';
import { useStyles, useTheme, withAlpha } from '../../theme';

interface Signal {
  id: string;
  symbol: string;
  direction: 'up' | 'down';
  durationLabel: string;
  at: number;
}

const DURATIONS = ['1:00', '3:00', '5:00', '10:00', '15:00'];

/** A fresh batch of random pair/direction/duration entries — pure Math.random, no real data. */
function generate(n: number, before?: number): Signal[] {
  const now = before ?? Date.now();
  return Array.from({ length: n }, (_, i) => {
    const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    return {
      id: `${now}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      symbol: asset.symbol,
      direction: Math.random() < 0.5 ? 'up' : 'down',
      durationLabel: DURATIONS[Math.floor(Math.random() * DURATIONS.length)],
      at: now - i * 60_000,
    };
  });
}

function SignalRow({ s }: { s: Signal }) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md },
    grow: { flex: 1, gap: 2 },
    symbol: { ...t.typography.subheading, color: t.colors.text },
    duration: { ...t.typography.caption, color: t.colors.muted },
    time: { ...t.typography.caption, color: t.colors.muted },
  }));
  const color = s.direction === 'up' ? colors.up : colors.down;
  const time = new Date(s.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.row}>
      <PairIcon symbol={s.symbol} size={26} />
      <View style={styles.grow}>
        <Text style={styles.symbol}>{s.symbol}</Text>
        <Text style={styles.duration}>Duration: {s.durationLabel}</Text>
      </View>
      <Ionicons name={s.direction === 'up' ? 'arrow-up' : 'arrow-down'} size={20} color={color} />
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

/**
 * Signals: a randomly generated demo feed, not real trading signals. It's styled plainly
 * (no "confidence", no performance-track-record claims) and re-rolls on demand, so nobody
 * could mistake it for actual market analysis.
 */
export default function SignalsScreen() {
  const { colors } = useTheme();
  const [seed, setSeed] = useState(0);
  const signals = useMemo(() => generate(15), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [latest, ...past] = signals;

  const styles = useStyles((t) => ({
    banner: {
      flexDirection: 'row',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.md,
      backgroundColor: withAlpha(t.colors.warn, 0.14),
      borderWidth: 1,
      borderColor: t.colors.warn,
    },
    bannerText: { ...t.typography.label, color: t.colors.text, flex: 1, lineHeight: 18 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    section: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    refresh: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    refreshText: { ...t.typography.label, color: t.colors.accent, fontWeight: '700' },
    divider: { height: 1, backgroundColor: t.colors.border },
    card: { backgroundColor: t.colors.card, borderRadius: t.radius.lg, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg },
  }));

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Signals" />

      <View style={styles.banner}>
        <Ionicons name="dice-outline" size={20} color={colors.warn} />
        <Text style={styles.bannerText}>
          Randomly generated for this demo — not real trading signals or financial advice. Tap Refresh for a new set.
        </Text>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Latest (demo)</Text>
        <Pressable style={styles.refresh} onPress={() => setSeed((s) => s + 1)} accessibilityRole="button">
          <Ionicons name="refresh" size={14} color={colors.accent} />
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <SignalRow s={latest} />
      </View>

      <Text style={styles.section}>Past signals (demo)</Text>
      <View style={styles.card}>
        {past.map((s, i) => (
          <View key={s.id}>
            {i > 0 && <View style={styles.divider} />}
            <SignalRow s={s} />
          </View>
        ))}
      </View>
    </Screen>
  );
}
