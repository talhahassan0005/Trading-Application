import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyles } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Shared frame for the three auth screens: brand, title. */
export function AuthLayout({ title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useStyles((t) => ({
    page: { flex: 1, backgroundColor: t.colors.page },
    content: { padding: t.spacing.xl, gap: t.spacing.lg },
    brand: { ...t.typography.heading, color: t.colors.accent, letterSpacing: 1 },
    title: { ...t.typography.title, color: t.colors.text },
    subtitle: { ...t.typography.body, color: t.colors.muted },
  }));
  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>TRYNEX</Text>
        <View style={{ gap: 6 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
