import React, { useState } from 'react';
import { Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthField } from '../../components/AuthField';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { OutlineField } from '../../components/OutlineField';
import { PickerField } from '../../components/PickerField';
import { Row } from '../../components/Row';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { COUNTRIES } from '../../data/countries';
import type { AppStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { useKycStore } from '../../store/kyc';
import { useProfileStore } from '../../store/profile';
import { useStyles, useTheme, withAlpha } from '../../theme';
import { KycSection } from './KycSection';

/** Quick-links row that opens the account submenu, like the reference "My account" panel. */
function AccountMenu() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const stack = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const styles = useStyles((t) => ({
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 48,
      paddingHorizontal: t.spacing.lg,
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
    },
    headText: { ...t.typography.subheading, color: t.colors.text },
    item: { paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.lg },
    itemText: { ...t.typography.body, color: t.colors.text, fontWeight: '600' },
    divider: { height: 1, backgroundColor: t.colors.border, marginHorizontal: t.spacing.lg },
  }));

  const items: Array<{ label: string; onPress: () => void }> = [
    { label: 'Withdrawal', onPress: () => stack.navigate('Withdraw') },
    { label: 'Payments', onPress: () => stack.navigate('Deposit') },
    { label: 'Trades', onPress: () => stack.navigate('Tabs', { screen: 'Portfolio' }) },
    { label: 'Market', onPress: () => stack.navigate('Tabs', { screen: 'Trade' }) },
    { label: 'Tournaments', onPress: () => stack.navigate('Tournaments') },
    { label: 'Analytics', onPress: () => stack.navigate('Analytics') },
  ];

  return (
    <View>
      <Pressable style={styles.head} onPress={() => setOpen(!open)} accessibilityRole="button">
        <Text style={styles.headText}>My account</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text} />
      </Pressable>
      {open && (
        <Card style={{ marginTop: 6, paddingVertical: 4 }}>
          {items.map((it, i) => (
            <View key={it.label}>
              {i > 0 && <View style={styles.divider} />}
              <Pressable
                style={styles.item}
                onPress={() => {
                  setOpen(false);
                  it.onPress();
                }}
              >
                <Text style={styles.itemText}>{it.label}</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}

export default function VerifyScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const kycStatus = useKycStore((s) => s.status);
  const profile = useProfileStore();
  const [saving, setSaving] = useState(false);

  const email = user?.email ?? '';
  const accountId = user ? String(user.accountNo) : '';
  const idVerified = kycStatus === 'verified';
  const requiredFilled = !!(profile.firstName.trim() && profile.lastName.trim() && profile.dateOfBirth && profile.country && profile.address.trim());

  const styles = useStyles((t) => ({
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.xs },
    divider: { height: 1, backgroundColor: t.colors.border },
    avatarRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: withAlpha(t.colors.accent, 0.18),
      alignItems: 'center',
      justifyContent: 'center',
    },
    camera: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    idText: { ...t.typography.body, color: t.colors.text, fontWeight: '700' },
    idSub: { ...t.typography.caption, color: t.colors.muted },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 8,
      height: 22,
      borderRadius: t.radius.pill,
    },
    badgeText: { ...t.typography.caption, color: t.colors.onAccent, fontWeight: '800' },
    securityHead: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    securityTitle: { ...t.typography.subheading, color: t.colors.text },
    securitySub: { ...t.typography.caption, color: t.colors.muted },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: t.spacing.sm },
    toggleText: { ...t.typography.body, color: t.colors.text, fontWeight: '600' },
    link: { ...t.typography.label, color: t.colors.accent, fontWeight: '700' },
    deleteRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.sm },
    deleteText: { ...t.typography.body, color: t.colors.down, fontWeight: '700' },
    addCardBtn: { height: 34, paddingHorizontal: t.spacing.md, alignSelf: 'flex-start' },
    empty: { ...t.typography.label, color: t.colors.muted },
  }));

  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    const err = await profile.save(user.id);
    setSaving(false);
    Alert.alert(err ? 'Could not save' : 'Saved', err ?? 'Your profile has been updated.');
  };

  const confirmDelete = () => {
    if (profile.deletionPending) {
      return Alert.alert('Deletion requested', 'Your request is waiting for review by our team. Do you want to cancel it?', [
        { text: 'Keep request', style: 'cancel' },
        {
          text: 'Cancel request',
          onPress: async () => {
            const err = await profile.cancelDeletion();
            Alert.alert(err ? 'Could not cancel' : 'Request cancelled', err ?? 'Your account will not be deleted.');
          },
        },
      ]);
    }
    Alert.alert(
      'Delete account',
      'Your request will be reviewed by our team. Once approved, your account and all its data are permanently deleted and you will be signed out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request deletion',
          style: 'destructive',
          onPress: async () => {
            const err = await profile.requestDeletion('Requested from the app');
            Alert.alert(err ? 'Could not send request' : 'Request sent', err ?? "We'll review your request and let you know.");
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <ScreenHeader title="Profile" />

      <AccountMenu />

      <Card style={{ gap: 14 }}>
        <Text style={styles.section}>Personal data</Text>
        <View style={styles.avatarRow}>
          <View>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color={colors.accent} />
            </View>
            <Pressable
              style={styles.camera}
              onPress={() => Alert.alert('Demo app', 'Photo upload is not available in this demo.')}
              accessibilityLabel="Change photo"
            >
              <Ionicons name="camera" size={13} color={colors.text} />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.idText} numberOfLines={1}>
              {email}
            </Text>
            <Text style={styles.idSub}>ID: {accountId}</Text>
            <View style={[styles.badge, { backgroundColor: idVerified ? colors.up : colors.down }]}>
              <Ionicons name={idVerified ? 'checkmark-circle' : 'close-circle'} size={12} color={colors.onAccent} />
              <Text style={styles.badgeText}>{idVerified ? 'Verified' : 'Not verified'}</Text>
            </View>
          </View>
        </View>

        <AuthField label="Nickname" value={profile.nickname || `#${accountId}`} onChangeText={(v) => profile.update({ nickname: v })} />
        <AuthField label="First Name" value={profile.firstName} onChangeText={(v) => profile.update({ firstName: v })} placeholder="Empty" />
        <AuthField label="Last Name" value={profile.lastName} onChangeText={(v) => profile.update({ lastName: v })} placeholder="Empty" />
        <OutlineField label="Date of birth" bg="card" minHeight={50}>
          <TextInput
            value={profile.dateOfBirth ?? ''}
            onChangeText={(v) => profile.update({ dateOfBirth: v || null })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            style={{ color: colors.text, paddingVertical: 12, fontSize: 15 }}
          />
        </OutlineField>
        <AuthField label="Email" value={email} editable={false} />
        <PickerField label="Country" icon="globe-outline" value={profile.country} placeholder="Empty" options={COUNTRIES} searchable onChange={(v) => profile.update({ country: v })} />
        <AuthField label="Address" value={profile.address} onChangeText={(v) => profile.update({ address: v })} placeholder="Empty" />
        <Button title="Save" onPress={save} loading={saving} />
      </Card>

      <Card>
        <Text style={styles.section}>Documents verification</Text>
        {user && <KycSection userId={user.id} requiredFilled={requiredFilled} saveProfile={() => profile.save(user.id)} />}
      </Card>

      <Card style={{ gap: 4 }}>
        <Text style={styles.section}>Security</Text>
        <View style={styles.securityHead}>
          <Ionicons name="checkmark-circle" size={22} color={colors.up} />
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Two-step verification</Text>
            <Text style={styles.securitySub}>Receiving codes via Email</Text>
          </View>
          <Pressable onPress={() => Alert.alert('Demo app', 'Changing the 2FA method is not available in this demo.')} hitSlop={8}>
            <Ionicons name="pencil" size={16} color={colors.accent} />
          </Pressable>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>To enter the platform</Text>
          <Switch
            value={profile.security.enterPlatform}
            onValueChange={(v) => profile.setSecurity({ enterPlatform: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleText}>To withdraw funds</Text>
          <Switch
            value={profile.security.withdrawFunds}
            onValueChange={(v) => profile.setSecurity({ withdrawFunds: v })}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
        <View style={styles.divider} />
        <Row
          left={<Ionicons name="lock-closed-outline" size={22} color={colors.muted} />}
          title="Password"
          subtitle="Change your account password"
          right={
            <Pressable onPress={() => Alert.alert('Demo app', 'Password changes are not available in this demo.')}>
              <Text style={styles.link}>Change</Text>
            </Pressable>
          }
        />
        <View style={styles.divider} />
        <Pressable style={styles.deleteRow} onPress={confirmDelete} accessibilityRole="button">
          <Ionicons name="close-circle" size={18} color={colors.down} />
          <Text style={styles.deleteText}>{profile.deletionPending ? 'Deletion requested — tap to cancel' : 'Delete My account'}</Text>
        </Pressable>
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={styles.section}>Credit / debit card verification</Text>
        <Button
          title="Add new card"
          variant="outline"
          style={styles.addCardBtn}
          onPress={() => Alert.alert('Demo app', 'Card verification is not available in this demo.')}
        />
        {profile.cards.length === 0 ? (
          <Text style={styles.empty}>You don't have any credit / debit cards for verification.</Text>
        ) : (
          profile.cards.map((c, i) => (
            <View key={c + i}>
              {i > 0 && <View style={styles.divider} />}
              <Row left={<Ionicons name="card-outline" size={22} color={colors.text} />} title={`•••• ${c}`} />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
