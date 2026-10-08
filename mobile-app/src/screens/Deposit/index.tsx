import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AmountField } from '../../components/AmountField';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { MethodPicker } from '../../components/MethodPicker';
import { Row } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { methodFor } from '../../data/paymentMethods';
import { PayMethod, useWalletStore } from '../../store/wallet';
import { useStyles, useTheme, withAlpha } from '../../theme';
import { money } from '../../utils/format';

export default function DepositScreen() {
  const { colors } = useTheme();
  const mode = useWalletStore((s) => s.mode);
  const transactions = useWalletStore((s) => s.transactions);
  const requestDeposit = useWalletStore((s) => s.requestDeposit);
  const confirmDeposit = useWalletStore((s) => s.confirmDeposit);
  const lastDeposit = useWalletStore((s) => s.lastDeposit[s.mode]);
  const [amount, setAmount] = useState('100');
  const [method, setMethod] = useState<PayMethod>('jazzcash');
  const [error, setError] = useState<string | null>(null);

  const deposits = transactions.filter((t) => t.type === 'deposit' && t.wallet === mode);
  const pending = deposits.filter((t) => t.status === 'pending');

  const styles = useStyles((t) => ({
    form: { gap: t.spacing.lg },
    error: { ...t.typography.label, color: t.colors.down },
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.xs },
    banner: {
      flexDirection: 'row',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.md,
      backgroundColor: withAlpha(t.colors.warn, 0.12),
      borderWidth: 1,
      borderColor: t.colors.warn,
    },
    bannerText: { ...t.typography.label, color: t.colors.text, flex: 1, lineHeight: 18 },
    note: { ...t.typography.caption, color: t.colors.muted, lineHeight: 15 },
    demoBtn: { minHeight: 36, paddingHorizontal: t.spacing.sm },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.md },
    divider: { height: 1, backgroundColor: t.colors.border },
  }));

  const submit = () => {
    const value = parseFloat(amount);
    const min = methodFor(method).minAmount;
    if (!(value >= min)) return setError(`Minimum deposit for this method is ${money(min)}.`);
    setError(null);
    requestDeposit(value, method); // stays PENDING — the balance is not credited here
  };

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Deposit" subtitle={`Adding to your ${mode} wallet`} />
      <Card style={styles.form}>
        <AmountField value={amount} onChange={setAmount} />
        <MethodPicker
          value={method}
          onChange={setMethod}
          lastUsed={lastDeposit}
          onRepeat={(last) => {
            setMethod(last.method);
            setAmount(String(last.amount));
          }}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Deposit" onPress={submit} />
        <Text style={styles.note}>
          Your balance is credited only after the payment is confirmed. No real payment is processed in this demo.
        </Text>
      </Card>

      {pending.length > 0 && (
        <View style={styles.banner}>
          <Ionicons name="time-outline" size={20} color={colors.warn} />
          <Text style={styles.bannerText}>
            {pending.length} deposit{pending.length > 1 ? 's' : ''} awaiting payment confirmation. Your balance will
            update once confirmed.
          </Text>
        </View>
      )}

      <Card>
        <Text style={styles.section}>Deposits</Text>
        {deposits.length === 0 ? (
          <Text style={styles.empty}>No deposits yet.</Text>
        ) : (
          deposits.map((d, i) => (
            <View key={d.id}>
              {i > 0 && <View style={styles.divider} />}
              <Row
                left={
                  <Ionicons
                    name={d.status === 'pending' ? 'time-outline' : 'checkmark-circle'}
                    size={24}
                    color={d.status === 'pending' ? colors.warn : colors.up}
                  />
                }
                title={d.label}
                subtitle={d.status === 'pending' ? 'PENDING · waiting for payment confirmation' : 'Completed'}
                right={
                  d.status === 'pending' ? (
                    <Button
                      title="Simulate confirm"
                      variant="outline"
                      style={styles.demoBtn}
                      onPress={() => confirmDeposit(d.id)}
                    />
                  ) : (
                    money(d.amount)
                  )
                }
                rightSub={d.status === 'pending' ? `${money(d.amount)} · demo control` : undefined}
              />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
