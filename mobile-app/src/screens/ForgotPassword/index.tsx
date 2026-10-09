import React, { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthField } from '../../components/AuthField';
import { AuthLayout } from '../../components/AuthLayout';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { useStyles } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const RESEND_SECONDS = 60;

/** Forgot password: email -> 6-digit code + new password -> signed in. */
export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const requestReset = useAuthStore((s) => s.requestPasswordReset);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const styles = useStyles((t) => ({
    card: { gap: t.spacing.lg },
    error: { ...t.typography.label, color: t.colors.down },
    hint: { ...t.typography.label, color: t.colors.muted, textAlign: 'center' },
    link: { ...t.typography.label, color: t.colors.accent, textAlign: 'center' },
  }));

  const sendCode = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    const err = await requestReset(email);
    setLoading(false);
    if (err) return setError(err);
    setStep('reset');
    setSecondsLeft(RESEND_SECONDS);
    setNotice('If an account exists for this email, a 6-digit code is on its way. Check your spam folder too.');
  };

  const submit = async () => {
    if (loading) return;
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    setError(null);
    const err = await resetPassword(email, code, password);
    setLoading(false);
    setError(err);
    // On success the auth store signs in and the root navigator swaps to the app.
  };

  if (step === 'email') {
    return (
      <AuthLayout title="Reset your password" subtitle="Enter your account email and we'll send you a 6-digit code.">
        <Card style={styles.card}>
          <AuthField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Send code" onPress={sendCode} loading={loading} disabled={!email.trim() || loading} />
        </Card>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to sign in</Text>
        </Pressable>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle={`Enter the code sent to ${email.trim()} and choose a new password.`}>
      <Card style={styles.card}>
        <AuthField
          label="6-digit code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
        />
        <AuthField label="New password" value={password} onChangeText={setPassword} secure placeholder="At least 6 characters" autoComplete="new-password" />
        <AuthField label="Confirm new password" value={confirm} onChangeText={setConfirm} secure autoComplete="new-password" />
        {notice && !error && <Text style={styles.hint}>{notice}</Text>}
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          title="Reset password"
          onPress={submit}
          loading={loading}
          disabled={code.length < 6 || !password || !confirm || loading}
        />
      </Card>
      {secondsLeft > 0 ? (
        <Text style={styles.hint}>Resend code in {secondsLeft}s</Text>
      ) : (
        <Pressable onPress={sendCode}>
          <Text style={styles.link}>Resend code</Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => {
          setStep('email');
          setError(null);
          setCode('');
        }}
      >
        <Text style={styles.link}>Use a different email</Text>
      </Pressable>
    </AuthLayout>
  );
}
