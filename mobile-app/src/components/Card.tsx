import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useStyles } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const styles = useStyles((t) => ({
    card: {
      backgroundColor: t.colors.card,
      borderColor: t.colors.border,
      borderWidth: 1,
      borderRadius: t.radius.lg,
      padding: t.spacing.lg,
    },
  }));
  return <View style={[styles.card, style]}>{children}</View>;
}
