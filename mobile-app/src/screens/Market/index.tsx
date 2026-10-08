import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Sheet } from '../../components/Sheet';
import { PROMO_CODES, usePromoStore } from '../../store/promo';
import { useStyles, useTheme } from '../../theme';

const PROMOS = [
  { title: 'Risk Free', icon: 'shield-outline' as const },
  { title: 'Cashback', icon: 'sparkles-outline' as const },
];

/** Market: promo codes. A matched code genuinely credits a demo-wallet bonus — no fake state. */
export default function MarketScreen() {
  const { colors } = useTheme();
  const redeemed = usePromoStore((s) => s.redeemed);
  const redeem = usePromoStore((s) => s.redeem);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const styles = useStyles((t) => ({
    promoCard: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    promoTitle: { ...t.typography.subheading, color: t.colors.text },
    promoSub: { ...t.typography.caption, color: t.colors.muted },
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.sm },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.lg },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: t.spacing.sm },
    rowText: { ...t.typography.body, color: t.colors.text },
    rowStatus: { ...t.typography.label, color: t.colors.up, fontWeight: '700' },
    colHead: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: t.colors.border },
    showAll: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: t.spacing.sm },
    showAllText: { ...t.typography.label, color: t.colors.muted },
    input: {
      ...t.typography.body,
      height: 48,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      color: t.colors.text,
      paddingHorizontal: t.spacing.md,
      marginBottom: t.spacing.md,
    },
    error: { ...t.typography.label, color: t.colors.down, marginBottom: t.spacing.sm },
    hint: { ...t.typography.caption, color: t.colors.muted, lineHeight: 15, marginTop: t.spacing.sm },
  }));

  const submit = () => {
    const res = redeem(code);
    if (!res.ok) return setError(res.error);
    setError(null);
    setSuccess(`+$${res.amount} added to your demo wallet.`);
    setCode('');
  };

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Market" subtitle="Promo codes — demo wallet bonuses only" />

      {PROMOS.map((p) => (
        <Card key={p.title} style={styles.promoCard}>
          <Ionicons name={p.icon} size={24} color={colors.text} />
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>{p.title}</Text>
            <Text style={styles.promoSub}>{PROMO_CODES.length} promo codes available</Text>
          </View>
        </Card>
      ))}

      <Card>
        <Text style={styles.section}>Your promo codes</Text>
        {redeemed.length === 0 ? (
          <>
            <Text style={styles.empty}>
              You don't have a promo code history yet. You can add a promo code using the button below.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.colHead}>PROMO CODE</Text>
              <Text style={styles.colHead}>STATUS</Text>
            </View>
            {redeemed.map((c, i) => (
              <View key={c}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.row}>
                  <Text style={styles.rowText}>{c}</Text>
                  <Text style={styles.rowStatus}>Redeemed</Text>
                </View>
              </View>
            ))}
            <Pressable style={styles.showAll} onPress={() => Alert.alert('Promo history', 'No more promo history to show.')}>
              <Ionicons name="time-outline" size={14} color={colors.muted} />
              <Text style={styles.showAllText}>Show all</Text>
            </Pressable>
          </>
        )}
        <Button title="Enter promo code" onPress={() => { setOpen(true); setError(null); setSuccess(null); }} style={{ marginTop: 12 }} />
      </Card>

      <Sheet visible={open} title="Enter promo code" onClose={() => setOpen(false)}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="e.g. WELCOME10"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {success && <Text style={styles.rowStatus}>{success}</Text>}
        <Button title="Redeem" onPress={submit} />
        <Text style={styles.hint}>Demo codes only credit the demo wallet — nothing real is added. Try WELCOME10.</Text>
      </Sheet>
    </Screen>
  );
}
