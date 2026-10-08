import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthField } from '../../components/AuthField';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthTabs } from '../../components/AuthTabs';
import { Card } from '../../components/Card';
import { Checkbox } from '../../components/Checkbox';
import { OutlineField } from '../../components/OutlineField';
import { PickerField } from '../../components/PickerField';
import { Sheet } from '../../components/Sheet';
import { COUNTRIES, CURRENCIES } from '../../data/countries';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { useStyles, useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const signUp = useAuthStore((s) => s.signUp);
  const [country, setCountry] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [promo, setPromo] = useState('');
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [notUsTaxpayer, setNotUsTaxpayer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);

  const styles = useStyles((t) => ({
    card: { gap: t.spacing.lg },
    error: { ...t.typography.label, color: t.colors.down },
    link: { ...t.typography.label, color: t.colors.accent },
    checkText: { ...t.typography.label, color: t.colors.text, flex: 1, lineHeight: 19 },
    promoRow: { flexDirection: 'row', alignItems: 'center' },
    promoInput: { ...t.typography.body, flex: 1, color: t.colors.text, paddingVertical: 12 },
    apply: { ...t.typography.label, color: t.colors.accent, fontWeight: '700' },
    submit: {
      height: 52,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.accent,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: t.spacing.sm,
    },
    submitText: { ...t.typography.subheading, color: t.colors.onAccent },
    arrowCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
    line: { flex: 1, height: 1, backgroundColor: t.colors.border },
    or: { ...t.typography.caption, color: t.colors.muted },
    google: {
      alignSelf: 'center',
      width: 64,
      height: 44,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: t.spacing.xs, marginTop: t.spacing.sm },
    footText: { ...t.typography.label, color: t.colors.muted },
    sheetText: { ...t.typography.body, color: t.colors.text, lineHeight: 21 },
  }));

  const submit = () => {
    if (!ageAccepted || !notUsTaxpayer) return setError('Please confirm both checkboxes to continue.');
    const err = signUp(email, password);
    setError(err);
    if (!err) navigation.navigate('VerifyCode');
  };

  return (
    <AuthLayout title="Create your account">
      <Card style={styles.card}>
        <AuthTabs value="register" onChange={(v) => v === 'login' && navigation.replace('SignIn')} />

        <PickerField
          label="Country / Region of residence"
          icon="globe-outline"
          value={country}
          placeholder="Search"
          options={COUNTRIES}
          searchable
          onChange={setCountry}
        />
        <PickerField label="Currency" value={currency} placeholder="Select" options={CURRENCIES} onChange={setCurrency} />
        <AuthField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <AuthField label="Password" value={password} onChangeText={setPassword} secure placeholder="At least 6 characters" />

        <OutlineField label="Promo code (optional)" bg="card" minHeight={50}>
          <View style={styles.promoRow}>
            <TextInput
              value={promo}
              onChangeText={setPromo}
              style={styles.promoInput}
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Pressable onPress={() => Alert.alert('Demo app', 'There are no promo codes in this demo.')} hitSlop={8}>
              <Text style={styles.apply}>Apply</Text>
            </Pressable>
          </View>
        </OutlineField>

        <Checkbox
          checked={ageAccepted}
          onChange={setAgeAccepted}
          label={
            <Text style={styles.checkText}>
              I confirm that I am 18 years old or older and accept{' '}
              <Text style={styles.link} onPress={() => setTerms(true)}>
                Service Agreement
              </Text>
            </Text>
          }
        />
        <Checkbox
          checked={notUsTaxpayer}
          onChange={setNotUsTaxpayer}
          label="I declare and confirm that I am not a citizen or resident of the US for tax purposes"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} onPress={submit} accessibilityRole="button">
          <Text style={styles.submitText}>Registration</Text>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={14} color={colors.onAccent} />
          </View>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>Sign in via</Text>
          <View style={styles.line} />
        </View>

        <Pressable
          style={styles.google}
          onPress={() => Alert.alert('Demo app', 'Google sign-up is not available in this demo.')}
          accessibilityLabel="Sign up with Google"
        >
          <Ionicons name="logo-google" size={20} color={colors.text} />
        </Pressable>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footText}>Already registered?</Text>
        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Sign in</Text>
        </Pressable>
      </View>

      <Sheet visible={terms} title="Service Agreement" onClose={() => setTerms(false)}>
        <Text style={styles.sheetText}>
          Trynex is a portfolio/demo project. There is no real trading, no real money, and no real Service Agreement —
          this screen exists only to match the look of a real broker's sign-up form.
        </Text>
      </Sheet>
    </AuthLayout>
  );
}
