import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../theme';

/** Title row for tab screens. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const styles = useStyles((t) => ({
    wrap: { gap: 4 },
    title: { ...t.typography.title, color: t.colors.text },
    sub: { ...t.typography.label, color: t.colors.muted },
  }));
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}
