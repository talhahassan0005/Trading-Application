import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  rightSub?: string;
  rightColor?: string;
}

/** Generic list row: optional icon, title/subtitle, right-aligned value. */
export function Row({ title, subtitle, left, right, rightSub, rightColor }: Props) {
  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md },
    grow: { flex: 1, gap: 2 },
    title: { ...t.typography.subheading, color: t.colors.text },
    sub: { ...t.typography.caption, color: t.colors.muted },
    right: { alignItems: 'flex-end', gap: 2 },
    value: { ...t.typography.mono, color: t.colors.text },
  }));
  return (
    <View style={styles.row}>
      {left}
      <View style={styles.grow}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>
        {typeof right === 'string' ? <Text style={[styles.value, rightColor ? { color: rightColor } : null]}>{right}</Text> : right}
        {rightSub ? <Text style={styles.sub}>{rightSub}</Text> : null}
      </View>
    </View>
  );
}
