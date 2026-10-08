import React from 'react';
import { Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Row } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Segmented } from '../../components/Segmented';
import { useAuthStore } from '../../store/auth';
import { Transaction, TxType, WalletMode, useWalletStore } from '../../store/wallet';
import { useStyles, useTheme } from '../../theme';
import { money, signedMoney } from '../../utils/format';

const ICONS: Record<TxType, keyof typeof Ionicons.glyphMap> = {
  deposit: 'arrow-down-circle',
  withdrawal: 'arrow-up-circle',
  'trade-win': 'trending-up',
  'trade-loss': 'trending-down',
  'trade-stake': 'swap-vertical',
};

const MODES: Array<{ label: string; value: WalletMode }> = [
  { label: 'Demo', value: 'demo' },
  { label: 'Real', value: 'real' },
];

export default function WalletScreen() {
  const { colors, isDark, toggle } = useTheme();
  const mode = useWalletStore((s) => s.mode);
  const setMode = useWalletStore((s) => s.setMode);
  const balance = useWalletStore((s) => s.balances[s.mode]);
  const held = useWalletStore((s) => s.held[s.mode]);
  const transactions = useWalletStore((s) => s.transactions);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const recent = transactions.filter((t) => t.wallet === mode).slice(0, 25);

  const styles = useStyles((t) => ({
    balCard: { gap: t.spacing.xs, alignItems: 'center' },
    balLabel: { ...t.typography.caption, color: t.colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
    balance: { fontSize: 36, fontWeight: '800', color: t.colors.text, fontVariant: ['tabular-nums'] },
    sub: { ...t.typography.label, color: t.colors.muted, textAlign: 'center' },
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.xs },
    empty: { ...t.typography.label, color: t.colors.muted, textAlign: 'center', paddingVertical: t.spacing.lg },
    divider: { height: 1, backgroundColor: t.colors.border },
    prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    prefText: { ...t.typography.body, color: t.colors.text },
  }));

  const rightFor = (tx: Transaction) => {
    if (tx.type === 'trade-loss') return { text: 'Lost', color: colors.down };
    if (tx.status !== 'completed') return { text: signedMoney(tx.amount), color: colors.warn };
    return { text: signedMoney(tx.amount), color: tx.amount > 0 ? colors.up : colors.text };
  };

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Wallet" subtitle={user ? `Signed in as ${user.email}` : undefined} />
      <Segmented options={MODES} value={mode} onChange={setMode} />

      <Card style={styles.balCard}>
        <Text style={styles.balLabel}>{mode === 'demo' ? 'Demo balance' : 'Real balance'}</Text>
        <Text style={styles.balance}>{money(balance)}</Text>
        {held > 0 && <Text style={styles.sub}>{money(held)} held for withdrawals</Text>}
        {mode === 'real' && <Text style={styles.sub}>No real money exists in this app — deposit to add funds.</Text>}
      </Card>

      <Card>
        <Text style={styles.section}>Recent transactions</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          recent.map((tx, i) => {
            const r = rightFor(tx);
            return (
              <View key={tx.id}>
                {i > 0 && <View style={styles.divider} />}
                <Row
                  left={<Ionicons name={ICONS[tx.type]} size={24} color={tx.status === 'completed' ? colors.accent : colors.warn} />}
                  title={tx.label}
                  subtitle={`${new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${tx.status !== 'completed' ? ' · ' + tx.status : ''}`}
                  right={r.text}
                  rightColor={r.color}
                />
              </View>
            );
          })
        )}
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={styles.prefRow}>
          <Text style={styles.prefText}>Light theme</Text>
          <Switch
            value={!isDark}
            onValueChange={toggle}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
        <Button title="Sign out" variant="outline" onPress={signOut} />
      </Card>
    </Screen>
  );
}
