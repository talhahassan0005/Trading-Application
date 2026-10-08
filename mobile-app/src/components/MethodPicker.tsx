import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES } from '../data/countries';
import { METHOD_CATEGORIES, PAYMENT_METHODS, PayMethod, methodFor } from '../data/paymentMethods';
import { useProfileStore } from '../store/profile';
import { useStyles, useTheme, withAlpha } from '../theme';
import { PaymentBadge } from './PaymentBadge';
import { PickerField } from './PickerField';

interface Props {
  value: PayMethod;
  onChange: (m: PayMethod) => void;
  /** The method/amount last used for a deposit (Deposit screen only) — drives the "Repeat" row. */
  lastUsed?: { method: PayMethod; amount: number };
  onRepeat?: (last: { method: PayMethod; amount: number }) => void;
}

const CATEGORY_ICON: Record<(typeof METHOD_CATEGORIES)[number], keyof typeof Ionicons.glyphMap> = {
  Popular: 'flame',
  'E-wallet': 'wallet',
  Bank: 'business',
  Crypto: 'logo-bitcoin',
};

/**
 * Deposit/withdraw method picker: a country row, category chips (Popular / E-wallet / Bank /
 * Crypto), and a list of methods with a generic colored icon — not the providers' real logo
 * artwork, since there's no live integration behind any of them. The "SANDBOX" tag makes that
 * explicit: this is where a real gateway sandbox (JazzCash/Easypaisa/Binance Pay all publish
 * one) would plug in later.
 */
export function MethodPicker({ value, onChange, lastUsed, onRepeat }: Props) {
  const { colors } = useTheme();
  const [category, setCategory] = useState<(typeof METHOD_CATEGORIES)[number]>('Popular');
  const country = useProfileStore((s) => s.country);
  const setCountry = useProfileStore((s) => s.update);
  const items = useMemo(() => PAYMENT_METHODS.filter((m) => m.categories.includes(category)), [category]);
  const showLastUsed = category === 'Popular' && !!lastUsed;

  const styles = useStyles((t) => ({
    wrap: { gap: t.spacing.md },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    label: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    sandbox: {
      paddingHorizontal: 6,
      height: 16,
      borderRadius: 4,
      backgroundColor: withAlpha(t.colors.warn, 0.18),
      alignItems: 'center',
      justifyContent: 'center',
    },
    sandboxText: { fontSize: 9, fontWeight: '800', color: t.colors.warn, letterSpacing: 0.4 },
    chips: { flexDirection: 'row', gap: t.spacing.sm },
    chip: {
      flex: 1,
      height: 56,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    chipOn: { backgroundColor: t.colors.accent },
    chipText: { fontSize: 10, fontWeight: '800', color: t.colors.muted, letterSpacing: 0.3 },
    chipTextOn: { color: t.colors.onAccent },
    sectionLabel: { ...t.typography.label, color: t.colors.text, fontWeight: '700' },
    // Fixed white card, regardless of app theme — matches the reference's payment-picker
    // look (a deliberate design choice for this picker, not a hardcoded-color oversight).
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.md,
      backgroundColor: '#FFFFFF',
      borderRadius: t.radius.md,
      paddingHorizontal: t.spacing.md,
      height: 64,
    },
    rowOn: { borderWidth: 2, borderColor: t.colors.accent },
    rowLabel: { ...t.typography.body, color: '#0F1115', fontWeight: '700' },
    rowSub: { ...t.typography.caption, color: '#6B7280' },
    lastTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      height: 18,
      borderRadius: 4,
      backgroundColor: '#EEF0F3',
    },
    lastTagText: { fontSize: 10, fontWeight: '700', color: '#4B5563' },
    repeatBtn: { height: 32, paddingHorizontal: 14, borderRadius: t.radius.sm, backgroundColor: t.colors.up, alignItems: 'center', justifyContent: 'center' },
    repeatText: { ...t.typography.caption, color: t.colors.onAccent, fontWeight: '800' },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Method</Text>
        <View style={styles.sandbox}>
          <Text style={styles.sandboxText}>SANDBOX</Text>
        </View>
      </View>

      <PickerField label="Country / Region" icon="globe-outline" value={country} placeholder="Select" options={COUNTRIES} searchable onChange={(v) => setCountry({ country: v })} />

      <View style={styles.chips}>
        {METHOD_CATEGORIES.map((c) => (
          <Pressable key={c} style={[styles.chip, category === c && styles.chipOn]} onPress={() => setCategory(c)} accessibilityRole="button">
            <Ionicons name={CATEGORY_ICON[c]} size={16} color={category === c ? colors.onAccent : colors.muted} />
            <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>
        Popular in your region ({items.length + (showLastUsed ? 1 : 0)})
      </Text>

      <View style={{ gap: 8 }}>
        {showLastUsed && lastUsed && (
          <View style={styles.row}>
            <PaymentBadge method={methodFor(lastUsed.method)} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.rowLabel}>{methodFor(lastUsed.method).label}</Text>
              <View style={styles.lastTag}>
                <Ionicons name="time-outline" size={10} color="#4B5563" />
                <Text style={styles.lastTagText}>Last used</Text>
              </View>
            </View>
            <Pressable style={styles.repeatBtn} onPress={() => onRepeat?.(lastUsed)} accessibilityRole="button">
              <Text style={styles.repeatText}>Repeat</Text>
            </Pressable>
          </View>
        )}
        {items.map((m) => {
          const on = m.id === value;
          return (
            <Pressable key={m.id} style={[styles.row, on && styles.rowOn]} onPress={() => onChange(m.id)} accessibilityRole="button">
              <PaymentBadge method={m} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.rowLabel}>{m.label}</Text>
                <Text style={styles.rowSub}>Min. ${m.minAmount.toFixed(2)}</Text>
              </View>
              <Ionicons name={on ? 'checkmark-circle' : 'chevron-forward'} size={20} color={on ? colors.accent : '#9CA3AF'} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
