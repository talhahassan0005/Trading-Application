import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStyles } from '../theme';
import { TextField } from './TextField';

interface Props {
  value: string;
  onChange: (v: string) => void;
  presets?: number[];
  label?: string;
}

/** Numeric dollar amount input with quick-pick chips. */
export function AmountField({ value, onChange, presets = [50, 100, 250, 500], label = 'Amount (USD)' }: Props) {
  const styles = useStyles((t) => ({
    chips: { flexDirection: 'row', gap: t.spacing.sm },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: t.spacing.sm,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
    },
    text: { ...t.typography.label, color: t.colors.text },
    wrap: { gap: t.spacing.sm },
  }));
  return (
    <View style={styles.wrap}>
      <TextField
        label={label}
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />
      <View style={styles.chips}>
        {presets.map((p) => (
          <Pressable key={p} style={styles.chip} onPress={() => onChange(String(p))}>
            <Text style={styles.text}>${p}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
