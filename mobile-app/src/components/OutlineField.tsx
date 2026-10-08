import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStyles } from '../theme';

interface Props {
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Background behind the label, so it "cuts" the border — match whatever sits behind the field. */
  bg?: 'surface' | 'card' | 'page';
  minHeight?: number;
}

/** Bordered box whose label sits on the top border (used for Timer / Investment, auth fields). */
export function OutlineField({ label, children, onPress, onLongPress, bg = 'surface', minHeight = 38 }: Props) {
  const styles = useStyles((t) => ({
    box: {
      flex: 1,
      minHeight,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.md,
      justifyContent: 'center',
    },
    label: {
      ...t.typography.label,
      position: 'absolute',
      top: -9,
      left: 12,
      paddingHorizontal: 4,
      color: t.colors.muted,
      backgroundColor: t.colors[bg],
    },
  }));
  return (
    <Pressable style={styles.box} onPress={onPress} onLongPress={onLongPress} disabled={!onPress}>
      <Text style={styles.label}>{label}</Text>
      <View>{children}</View>
    </Pressable>
  );
}
