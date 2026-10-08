import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme';

interface Props {
  steps: string[];
  /** Index of the active step; steps before it are done, and the last step is done when active. */
  current: number;
}

/** Vertical status timeline (e.g. requested -> under review -> paid). */
export function Timeline({ steps, current }: Props) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', gap: t.spacing.md },
    rail: { alignItems: 'center', width: 24 },
    dot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    line: { width: 2, flex: 1, minHeight: 18 },
    text: { ...t.typography.body, paddingBottom: t.spacing.md, flex: 1 },
  }));

  return (
    <View>
      {steps.map((label, i) => {
        const isLast = i === steps.length - 1;
        const done = i < current || (isLast && i === current);
        const active = i === current && !done;
        const color = done ? colors.up : active ? colors.warn : colors.border;
        return (
          <View key={label} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { borderColor: color, backgroundColor: done ? color : 'transparent' }]}>
                {done && <Ionicons name="checkmark" size={14} color={colors.onAccent} />}
                {active && <Ionicons name="time" size={13} color={colors.warn} />}
              </View>
              {!isLast && <View style={[styles.line, { backgroundColor: i < current ? colors.up : colors.border }]} />}
            </View>
            <Text style={[styles.text, { color: done || active ? colors.text : colors.muted, fontWeight: active ? '700' : '400' }]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
