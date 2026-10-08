import React, { useState } from 'react';
import { Pressable, TextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme';
import { OutlineField } from './OutlineField';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Adds a show/hide eye icon and masks the value until tapped. */
  secure?: boolean;
}

/** Bordered text input matching the auth screens' field style (label cut into the top border). */
export function AuthField({ label, secure, value, onChangeText, ...rest }: Props) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(true);
  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center' },
    input: { ...t.typography.body, flex: 1, color: t.colors.text, paddingVertical: 12 },
  }));
  return (
    <OutlineField label={label} bg="card" minHeight={50}>
      <Pressable style={styles.row} onPress={() => {}}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          secureTextEntry={secure && hidden}
          {...rest}
        />
        {secure && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={8} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
          </Pressable>
        )}
      </Pressable>
    </OutlineField>
  );
}
