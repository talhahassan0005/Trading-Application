import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { AppStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { useStyles, useTheme } from '../../theme';

/** Plain row: icon + title, in the app's own text color (no icon tile, no subtitle). */
function MenuRow({ icon, title, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    row: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md },
    title: { ...t.typography.subheading, color: t.colors.text, fontWeight: '700', flex: 1 },
  }));
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={24} color={colors.text} />
      <Text style={styles.title}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

/** Plain text-only row, no icon — matches the reference menu's second block. */
function TextRow({ title, onPress }: { title: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles((t) => ({
    row: { paddingVertical: t.spacing.md },
    title: { ...t.typography.body, color: t.colors.text, fontWeight: '600' },
  }));
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

/**
 * "More" tab: a menu for the screens that don't get their own spot on the 5-icon tab bar.
 */
export default function MoreScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const signOut = useAuthStore((s) => s.signOut);

  const styles = useStyles((t) => ({
    divider: { height: 1, backgroundColor: t.colors.border, marginVertical: 4 },
    settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: t.spacing.md },
    settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    settingsText: { ...t.typography.body, color: t.colors.accent, fontWeight: '700' },
    logoutLeft: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm },
    logoutText: { ...t.typography.body, color: t.colors.down, fontWeight: '700' },
  }));

  const confirmSignOut = () =>
    Alert.alert('Log out', 'Sign out of Trynex?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <Screen>
      <ScreenHeader title="More" />

      <Card style={{ gap: 0 }}>
        <MenuRow icon="cash-outline" title="Market" onPress={() => navigation.navigate('Market')} />
        <MenuRow icon="pie-chart-outline" title="Analytics" onPress={() => navigation.navigate('Analytics')} />
        <MenuRow icon="briefcase-outline" title="TOP" onPress={() => navigation.navigate('Leaderboard')} />
        <MenuRow icon="radio-outline" title="Signals" onPress={() => navigation.navigate('Signals')} />
      </Card>

      <Card style={{ gap: 0 }}>
        <TextRow title="Deposit" onPress={() => navigation.navigate('Deposit')} />
        <View style={styles.divider} />
        <TextRow title="Withdrawal" onPress={() => navigation.navigate('Withdraw')} />
        <View style={styles.divider} />
        <TextRow title="Wallet" onPress={() => navigation.navigate('Wallet')} />
        <View style={styles.divider} />
        <TextRow title="Trades" onPress={() => navigation.navigate('Tabs', { screen: 'Portfolio' })} />
        <View style={styles.divider} />
        <TextRow title="Tournaments" onPress={() => navigation.navigate('Tournaments')} />
      </Card>

      <Card style={{ gap: 0 }}>
        <Pressable style={styles.settingsRow} onPress={() => navigation.navigate('Settings')} accessibilityRole="button">
          <View style={styles.settingsLeft}>
            <Ionicons name="settings-outline" size={20} color={colors.accent} />
            <Text style={styles.settingsText}>Settings</Text>
          </View>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.settingsRow} onPress={confirmSignOut} accessibilityRole="button">
          <View style={styles.logoutLeft}>
            <Ionicons name="log-out-outline" size={20} color={colors.down} />
            <Text style={styles.logoutText}>Log out</Text>
          </View>
        </Pressable>
      </Card>
    </Screen>
  );
}
