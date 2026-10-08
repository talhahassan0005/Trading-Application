import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { useStyles, useTheme } from '../theme';

interface Props extends TextInputProps {
  label: string;
}

export function TextField({ label, style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    wrap: { gap: t.spacing.xs },
    label: { ...t.typography.label, color: t.colors.muted },
    input: {
      ...t.typography.body,
      minHeight: 48,
      paddingHorizontal: t.spacing.md,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      color: t.colors.text,
    },
  }));
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}
