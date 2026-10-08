import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../../components/Button';
import { AmountField } from '../../components/AmountField';
import { Card } from '../../components/Card';
import { MethodPicker } from '../../components/MethodPicker';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TextField } from '../../components/TextField';
import { Timeline } from '../../components/Timeline';
import { PayMethod, useWalletStore } from '../../store/wallet';
import { useStyles } from '../../theme';
import { money } from '../../utils/format';

const DEST_LABEL: Record<PayMethod, string> = {
  jazzcash: 'JazzCash mobile number',
  easypaisa: 'Easypaisa mobile number',
  bank: 'Bank account (IBAN)',
  binance: 'Binance Pay ID',
  usdt: 'USDT (TRC-20) wallet address',
  usdt_erc20: 'USDT (ERC-20) wallet address',
};

const STEPS = ['Requested (funds held)', 'Under review', 'Paid'];

export default function WithdrawScreen() {
  const mode = useWalletStore((s) => s.mode);
  const balance = useWalletStore((s) => s.balances[s.mode]);
  const held = useWalletStore((s) => s.held[s.mode]);
  const transactions = useWalletStore((s) => s.transactions);
  const requestWithdrawal = useWalletStore((s) => s.requestWithdrawal);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayMethod>('jazzcash');
  const [dest, setDest] = useState('');
  const [error, setError] = useState<string | null>(null);

  const withdrawals = transactions.filter((t) => t.type === 'withdrawal' && t.wallet === mode);

  const styles = useStyles((t) => ({
    form: { gap: t.spacing.lg },
    avail: { flexDirection: 'row', justifyContent: 'space-between' },
    muted: { ...t.typography.label, color: t.colors.muted },
    strong: { ...t.typography.label, color: t.colors.text, fontWeight: '700' },
    error: { ...t.typography.label, color: t.colors.down },
    section: { ...t.typography.subheading, color: t.colors.text },
    head: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.spacing.md },
    amountText: { ...t.typography.subheading, color: t.colors.text },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.md },
  }));

  const submit = () => {
    if (!dest.trim()) return setError('Enter where the funds should be sent.');
    const res = requestWithdrawal(parseFloat(amount), method);
    if (!res.ok) return setError(res.error);
    setError(null);
    setAmount('');
    setDest('');
  };

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Withdraw" subtitle={`From your ${mode} wallet`} />
      <Card style={styles.form}>
        <View style={styles.avail}>
          <Text style={styles.muted}>Available</Text>
          <Text style={styles.strong}>{money(balance)}</Text>
        </View>
        {held > 0 && (
          <View style={styles.avail}>
            <Text style={styles.muted}>Held for withdrawals</Text>
            <Text style={styles.strong}>{money(held)}</Text>
          </View>
        )}
        <AmountField value={amount} onChange={setAmount} presets={[50, 100, 250, 500]} />
        <MethodPicker value={method} onChange={setMethod} />
        <TextField label={DEST_LABEL[method]} value={dest} onChangeText={setDest} />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Request withdrawal" onPress={submit} />
      </Card>

      <Text style={styles.section}>Requests</Text>
      {withdrawals.length === 0 ? (
        <Text style={styles.empty}>No withdrawal requests yet.</Text>
      ) : (
        withdrawals.map((w) => (
          <Card key={w.id}>
            <View style={styles.head}>
              <Text style={styles.amountText}>{money(-w.amount)}</Text>
              <Text style={styles.muted}>{w.label}</Text>
            </View>
            <Timeline steps={STEPS} current={w.stage ?? 0} />
          </Card>
        ))
      )}
    </Screen>
  );
}
