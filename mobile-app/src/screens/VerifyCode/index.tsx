import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/AuthLayout';
import { Button } from '../../components/Button';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { useStyles } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyCode'>;

const LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyCodeScreen({ navigation }: Props) {
  const pending = useAuthStore((s) => s.pending);
  const verifyCode = useAuthStore((s) => s.verifyCode);
  const resendCode = useAuthStore((s) => s.resendCode);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  // Resend countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const styles = useStyles((t) => ({
    boxes: { flexDirection: 'row', justifyContent: 'space-between' },
    box: {
      width: 46,
      height: 56,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxActive: { borderColor: t.colors.accent },
    digit: { ...t.typography.heading, color: t.colors.text },
    hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
    hint: { ...t.typography.label, color: t.colors.muted, textAlign: 'center' },
    error: { ...t.typography.label, color: t.colors.down },
    link: { ...t.typography.label, color: t.colors.accent, textAlign: 'center' },
  }));

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    const err = await verifyCode(code);
    setLoading(false);
    setError(err);
    // On success the auth store sets `user` and the root navigator swaps to the app.
  };

  const resend = async () => {
    setSecondsLeft(RESEND_SECONDS);
    setNotice(null);
    const err = await resendCode();
    setError(err);
    if (!err) setNotice('A new code is on its way.');
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${pending?.email ?? 'your email'}.`}
    >
      <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length: LENGTH }, (_, i) => (
          <View key={i} style={[styles.box, i === Math.min(code.length, LENGTH - 1) && styles.boxActive]}>
            <Text style={styles.digit}>{code[i] ?? ''}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        style={styles.hidden}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, LENGTH))}
        keyboardType="number-pad"
        maxLength={LENGTH}
        autoFocus
        textContentType="oneTimeCode"
      />
      <Text style={styles.hint}>Check your inbox (and spam folder) for the code.</Text>
      {notice && <Text style={styles.hint}>{notice}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Verify" onPress={submit} loading={loading} disabled={code.length < LENGTH || loading} />
      {secondsLeft > 0 ? (
        <Text style={styles.hint}>Resend code in {secondsLeft}s</Text>
      ) : (
        <Pressable onPress={resend}>
          <Text style={styles.link}>Resend code</Text>
        </Pressable>
      )}
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back</Text>
      </Pressable>
    </AuthLayout>
  );
}
