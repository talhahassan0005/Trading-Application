import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthField } from '../../components/AuthField';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthTabs } from '../../components/AuthTabs';
import { Card } from '../../components/Card';
import { Checkbox } from '../../components/Checkbox';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/auth';
import { useStyles, useTheme } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const styles = useStyles((t) => ({
    card: { gap: t.spacing.lg },
    error: { ...t.typography.label, color: t.colors.down },
    link: { ...t.typography.label, color: t.colors.accent },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  }));

  return (
    <AuthLayout title="Sign in to your account">
      <Card style={styles.card}>
        <AuthTabs value="login" onChange={(v) => v === 'register' && navigation.replace('SignUp')} />

        <AuthField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <AuthField label="Password" value={password} onChangeText={setPassword} secure autoComplete="password" />

        <View style={styles.row}>
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
          <Pressable onPress={() => Alert.alert('Demo app', 'Password reset is not available in this demo.')}>
            <Text style={styles.link}>Forgot your password?</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} onPress={() => setError(signIn(email, password))} accessibilityRole="button">
          <Text style={styles.submitText}>Sign in</Text>
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-forward" size={14} color={colors.onAccent} />
          </View>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>Sign in via</Text>
          <View style={styles.line} />
        </View>

        <Pressable style={styles.google} onPress={signInWithGoogle} accessibilityLabel="Sign in with Google">
          <Ionicons name="logo-google" size={20} color={colors.text} />
        </Pressable>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footText}>New to Trynex?</Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.link}>Create account</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
