import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStyles } from '../theme';

interface Props<T extends string | number> {
  label?: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}

/** Compact segmented control (used for timeframe and expiry). */
export function Segmented<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  const styles = useStyles((t) => ({
    wrap: { gap: t.spacing.xs },
    label: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    row: {
      flexDirection: 'row',
      backgroundColor: t.colors.surface,
      borderColor: t.colors.border,
      borderWidth: 1,
      borderRadius: t.radius.md,
      padding: 3,
    },
    item: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: t.radius.sm },
    itemActive: { backgroundColor: t.colors.accent },
    text: { ...t.typography.label, color: t.colors.muted },
    textActive: { color: t.colors.onAccent, fontWeight: '700' },
  }));
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => onChange(o.value)}
            >
              <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
