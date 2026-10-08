import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyles } from '../theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  /** Reserve space for the status bar (tab screens have no native header). */
  topInset?: boolean;
  style?: ViewStyle;
}

/** Themed page container with safe-area handling. */
export function Screen({ children, scroll = true, topInset = true, style }: Props) {
  const styles = useStyles((t) => ({
    page: { flex: 1, backgroundColor: t.colors.page },
    content: { padding: t.spacing.lg, gap: t.spacing.lg },
  }));
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: topInset ? insets.top + 8 : 0 };
  if (!scroll) return <View style={[styles.page, styles.content, pad, style]}>{children}</View>;
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, pad, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
