import React from 'react';
import { Text, View } from 'react-native';
import { useStyles, useTheme } from '../theme';

interface Props {
  /** The value to mark on the bar (e.g. a single trade's max profit). */
  value: number;
  /** Scale boundaries, low to high (e.g. [-1000, 0, 1000]) — used for both zones and labels. */
  bounds: [number, number, number];
  labels: [string, string, string];
}

/** Three-zone (loss / small win / big win) horizontal range bar with a marker for `value`. */
export function RangeBar({ value, bounds, labels }: Props) {
  const { colors } = useTheme();
  const [lo, mid, hi] = bounds;
  const clamped = Math.min(hi, Math.max(lo, value));
  const pct = ((clamped - lo) / (hi - lo)) * 100;

  const styles = useStyles((t) => ({
    track: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'visible' },
    zone: { height: 10 },
    marker: {
      position: 'absolute',
      top: -3,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: t.colors.text,
      borderWidth: 2,
      borderColor: t.colors.page,
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: t.spacing.sm },
    label: { ...t.typography.caption, color: t.colors.muted },
  }));

  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.zone, { flex: 1, backgroundColor: colors.down, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} />
        <View style={[styles.zone, { flex: 1, backgroundColor: colors.warn }]} />
        <View style={[styles.zone, { flex: 1, backgroundColor: colors.up, borderTopRightRadius: 5, borderBottomRightRadius: 5 }]} />
        <View style={[styles.marker, { left: `${pct}%`, marginLeft: -8 }]} />
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{labels[0]}</Text>
        <Text style={styles.label}>{labels[1]}</Text>
        <Text style={styles.label}>{labels[2]}</Text>
      </View>
    </View>
  );
}
