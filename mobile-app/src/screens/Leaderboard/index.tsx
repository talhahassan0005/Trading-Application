import React from 'react';
import { Text, View } from 'react-native';
import { Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Row } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { LEADERBOARD } from '../../data/leaderboard';
import { useAuthStore } from '../../store/auth';
import { useStyles, useTheme } from '../../theme';
import { accountId } from '../../utils/accountId';
import { money } from '../../utils/format';

/** A demo leaderboard — fictional names and amounts, not connected to any real ranking. */
export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const id = accountId(user?.email ?? 'demo@trynex.app');

  const styles = useStyles((t) => ({
    you: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: t.spacing.sm,
    },
    youId: { ...t.typography.subheading, color: t.colors.text },
    youAmount: { ...t.typography.subheading, color: t.colors.up },
    posRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
    posLabel: { ...t.typography.caption, color: t.colors.muted },
    howRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: t.spacing.sm,
      marginTop: t.spacing.sm,
    },
    howText: { ...t.typography.label, color: t.colors.accent, fontWeight: '700' },
    divider: { height: 1, backgroundColor: t.colors.border },
    rankBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: { ...t.typography.caption, color: t.colors.onAccent, fontWeight: '800' },
    rankPlain: { ...t.typography.label, color: t.colors.muted, width: 24, textAlign: 'center' },
    note: { ...t.typography.caption, color: t.colors.muted, textAlign: 'center', lineHeight: 15 },
  }));

  const medalColor = (rank: number) => (rank === 1 ? '#D4AF37' : rank === 2 ? '#B9C4CC' : rank === 3 ? '#C97A3D' : colors.card);

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Leaderboard" subtitle="Demo data — of the day" />

      <Card>
        <View style={styles.you}>
          <Text style={styles.youId}>#{id}</Text>
          <Text style={styles.youAmount}>$0.00</Text>
        </View>
        <View style={styles.posRow}>
          <Text style={styles.posLabel}>Your position</Text>
          <Text style={styles.posLabel}>—</Text>
        </View>
        <Pressable
          style={styles.howRow}
          onPress={() => Alert.alert('Demo leaderboard', 'This board is entirely fictional and only for demo purposes — it does not reflect real trading performance.')}
        >
          <Ionicons name="gift-outline" size={16} color={colors.accent} />
          <Text style={styles.howText}>How does this leaderboard work?</Text>
        </Pressable>
      </Card>

      <Card>
        {LEADERBOARD.map((e, i) => (
          <View key={e.rank}>
            {i > 0 && <View style={styles.divider} />}
            <Row
              left={
                e.rank <= 3 ? (
                  <View style={[styles.rankBadge, { backgroundColor: medalColor(e.rank) }]}>
                    <Text style={styles.rankText}>{e.rank}</Text>
                  </View>
                ) : (
                  <Text style={styles.rankPlain}>{e.rank}</Text>
                )
              }
              title={`${e.flag} ${e.name}`}
              right={money(e.amount)}
              rightColor={colors.up}
            />
          </View>
        ))}
      </Card>

      <Text style={styles.note}>Fictional demo data — not real traders or real winnings.</Text>
    </Screen>
  );
}
