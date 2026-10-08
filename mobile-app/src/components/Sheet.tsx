import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStyles, withAlpha } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Simple bottom sheet with a dimmed backdrop. */
export function Sheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const styles = useStyles((t) => ({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: withAlpha(t.colors.page, 0.7) },
    sheet: {
      backgroundColor: t.colors.card,
      borderTopLeftRadius: t.radius.lg,
      borderTopRightRadius: t.radius.lg,
      borderColor: t.colors.border,
      borderWidth: 1,
      padding: t.spacing.lg,
      gap: t.spacing.sm,
      maxHeight: '75%',
    },
    title: { ...t.typography.heading, color: t.colors.text, marginBottom: t.spacing.xs },
  }));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <View>{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
