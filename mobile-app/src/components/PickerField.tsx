import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStyles, useTheme } from '../theme';
import { OutlineField } from './OutlineField';
import { Sheet } from './Sheet';

interface Props {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: string | null;
  placeholder: string;
  options: string[];
  searchable?: boolean;
  onChange: (value: string) => void;
}

/** Bordered field that opens a sheet list to pick a value (used for Country / Currency). */
export function PickerField({ label, icon, value, placeholder, options, searchable, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => (query.trim() ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())) : options),
    [options, query],
  );

  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingVertical: 12 },
    value: { ...t.typography.body, color: value ? t.colors.text : t.colors.muted, flex: 1 },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      paddingHorizontal: t.spacing.md,
      height: 44,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      marginBottom: t.spacing.sm,
    },
    searchInput: { ...t.typography.body, flex: 1, color: t.colors.text },
    item: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.colors.border },
    itemText: { ...t.typography.body, color: t.colors.text },
    itemActive: { color: t.colors.accent, fontWeight: '700' },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.lg },
  }));

  return (
    <>
      <OutlineField label={label} bg="card" minHeight={50} onPress={() => setOpen(true)}>
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={18} color={colors.muted} />}
          <Text style={styles.value} numberOfLines={1}>
            {value ?? placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </View>
      </OutlineField>

      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        {searchable && (
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
        <FlatList
          data={filtered}
          keyExtractor={(o) => o}
          style={{ maxHeight: 320 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => {
                onChange(item);
                setOpen(false);
                setQuery('');
              }}
            >
              <Text style={[styles.itemText, item === value && styles.itemActive]}>{item}</Text>
            </Pressable>
          )}
        />
      </Sheet>
    </>
  );
}
