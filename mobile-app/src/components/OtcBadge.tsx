import React from 'react';
import { Text, View } from 'react-native';
import { useStyles } from '../theme';
import { withAlpha } from '../theme/colors';

export function OtcBadge() {
  const styles = useStyles((t) => ({
    badge: {
      backgroundColor: withAlpha(t.colors.accent, 0.18),
      borderRadius: t.radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    text: { ...t.typography.caption, color: t.colors.accent, fontWeight: '800' },
  }));
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>OTC</Text>
    </View>
  );
}
