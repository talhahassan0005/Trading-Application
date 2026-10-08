import React from 'react';
import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';
import { useStyles, useTheme } from '../theme';

type Variant = 'primary' | 'up' | 'down' | 'outline' | 'ghost';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, icon, style }: Props) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    base: {
      minHeight: 48,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.sm,
      borderWidth: 1,
    },
    text: { ...t.typography.subheading },
  }));

  const fill: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.accent, fg: colors.onAccent, border: colors.accent },
    up: { bg: colors.up, fg: colors.onAccent, border: colors.up },
    down: { bg: colors.down, fg: colors.onAccent, border: colors.down },
    outline: { bg: 'transparent', fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.accent, border: 'transparent' },
  };
  const f = fill[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: f.bg, borderColor: f.border, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={f.fg} /> : icon}
      {!loading && <Text style={[styles.text, { color: f.fg }]}>{title}</Text>}
    </Pressable>
  );
}
