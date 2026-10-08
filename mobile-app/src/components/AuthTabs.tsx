import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStyles } from '../theme';

/** Login / Registration toggle at the top of the auth card. */
export function AuthTabs({ value, onChange }: { value: 'login' | 'register'; onChange: (v: 'login' | 'register') => void }) {
  const styles = useStyles((t) => ({
    row: {
      flexDirection: 'row',
      backgroundColor: t.colors.page,
      borderRadius: t.radius.md,
      padding: 3,
    },
    item: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: t.radius.sm },
    itemActive: { backgroundColor: t.colors.surface },
    text: { ...t.typography.subheading, color: t.colors.muted },
    textActive: { color: t.colors.text, fontWeight: '800' },
  }));
  return (
    <View style={styles.row}>
      <Pressable style={[styles.item, value === 'login' && styles.itemActive]} onPress={() => onChange('login')}>
        <Text style={[styles.text, value === 'login' && styles.textActive]}>Login</Text>
      </Pressable>
      <Pressable style={[styles.item, value === 'register' && styles.itemActive]} onPress={() => onChange('register')}>
        <Text style={[styles.text, value === 'register' && styles.textActive]}>Registration</Text>
      </Pressable>
    </View>
  );
}
