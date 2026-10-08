import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Segmented } from '../../components/Segmented';
import { TOURNAMENTS, Tournament, useTournamentsStore } from '../../store/tournaments';
import { useStyles, useTheme, withAlpha } from '../../theme';
import { money } from '../../utils/format';

function TournamentCard({ t }: { t: Tournament }) {
  const { colors } = useTheme();
  const joined = useTournamentsStore((s) => s.joined.has(t.id));
  const join = useTournamentsStore((s) => s.join);

  const styles = useStyles((th) => ({
    card: { overflow: 'hidden', padding: 0 },
    banner: {
      height: 90,
      backgroundColor: withAlpha(th.colors.accent, 0.18),
      padding: th.spacing.md,
      justifyContent: 'space-between',
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      height: 22,
      borderRadius: th.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { ...th.typography.caption, color: th.colors.onAccent, fontWeight: '800' },
    bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    title: { ...th.typography.heading, color: th.colors.text },
    poolLabel: { ...th.typography.caption, color: th.colors.muted, textAlign: 'right' },
    poolValue: { ...th.typography.subheading, color: th.colors.up, textAlign: 'right' },
    stats: { flexDirection: 'row', padding: th.spacing.md, gap: th.spacing.md },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { ...th.typography.subheading, color: th.colors.text },
    statLabel: { ...th.typography.caption, color: th.colors.muted },
    vDivider: { width: 1, backgroundColor: th.colors.border },
    detailsBtn: {
      margin: th.spacing.md,
      marginTop: 0,
      height: 44,
      borderRadius: th.radius.sm,
      backgroundColor: joined ? th.colors.up : th.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    detailsText: { ...th.typography.body, color: joined ? th.colors.onAccent : th.colors.text, fontWeight: '700' },
  }));

  const onPress = () => {
    if (t.status === 'completed') {
      return Alert.alert(t.title, `This demo tournament finished with a prize pool of ${money(t.prizePool)}.`);
    }
    if (joined) return Alert.alert(t.title, "You're already in — this is a demo, no real prize is paid out.");
    Alert.alert(
      t.title,
      t.entryFee > 0
        ? `Join for a ${money(t.entryFee)} demo entry fee? This is simulated — nothing real is charged or paid out.`
        : 'Join this free demo tournament? Nothing real is paid out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => {
            const res = join(t.id);
            if (!res.ok) Alert.alert('Could not join', res.error);
          },
        },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.banner}>
        <View style={[styles.badge, { backgroundColor: t.status === 'active' ? colors.accent : colors.muted }]}>
          <Text style={styles.badgeText}>{t.status === 'active' ? 'ACTIVE NOW' : 'FINISHED'}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.title}>{t.title}</Text>
          <View>
            <Text style={styles.poolLabel}>PRIZE POOL</Text>
            <Text style={styles.poolValue}>{money(t.prizePool)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{t.entryFee > 0 ? money(t.entryFee) : 'Free'}</Text>
          <Text style={styles.statLabel}>Entry fee</Text>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{t.durationLabel}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
      </View>
      <Pressable style={styles.detailsBtn} onPress={onPress} accessibilityRole="button">
        {joined && <Ionicons name="checkmark-circle" size={16} color={colors.onAccent} />}
        <Text style={styles.detailsText}>{t.status === 'completed' ? 'Details' : joined ? 'Joined' : 'Join'}</Text>
        {!joined && t.status === 'active' && <Ionicons name="information-circle-outline" size={16} color={colors.text} />}
      </Pressable>
    </Card>
  );
}

/** Tournaments: entirely a cosmetic demo feature — no real entry fees or prizes. */
export default function TournamentsScreen() {
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const items = useMemo(() => TOURNAMENTS.filter((t) => t.status === tab), [tab]);

  const styles = useStyles((t) => ({
    note: { ...t.typography.caption, color: t.colors.muted, textAlign: 'center', lineHeight: 15 },
  }));

  return (
    <Screen topInset={false}>
      <ScreenHeader title="Tournaments" />
      <Segmented
        options={[
          { label: `Active (${TOURNAMENTS.filter((t) => t.status === 'active').length})`, value: 'active' as const },
          { label: `Completed (${TOURNAMENTS.filter((t) => t.status === 'completed').length})`, value: 'completed' as const },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Text style={styles.note}>Demo tournaments only — entry fees are simulated and no real prizes are ever paid out.</Text>
      {items.map((t) => (
        <TournamentCard key={t.id} t={t} />
      ))}
    </Screen>
  );
}
