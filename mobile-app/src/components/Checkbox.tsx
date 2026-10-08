import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Plain text, or a <Text> tree (e.g. with an embedded link) rendered in the same style. */
  label: React.ReactNode;
}

export function Checkbox({ checked, onChange, label }: Props) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md },
    box: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxOn: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
    label: { ...t.typography.label, color: t.colors.text, flex: 1, lineHeight: 19 },
  }));
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}
      onPress={() => onChange(!checked)}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked && <Ionicons name="checkmark" size={16} color={colors.onAccent} />}
      </View>
      {typeof label === 'string' ? <Text style={styles.label}>{label}</Text> : <View style={{ flex: 1 }}>{label}</View>}
    </Pressable>
  );
}
