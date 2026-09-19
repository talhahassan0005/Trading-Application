import { useState, type FormEvent } from 'react';
import { Sun, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Text, Card, TextField, Checkbox, Button } from '../components';

export function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [require2fa, setRequire2fa] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password, require2fa);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-up">
        <Card>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <Sun className="h-[18px] w-[18px] text-white" />
            </div>
            <Text variant="title">Vertex Admin</Text>
          </div>

          <Text variant="bodySmall" color="text-ink-secondary" className="mb-6">
            Staff access only. All actions are logged.
          </Text>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              label="Work email"
              placeholder="you@vertex.internal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
              autoComplete="username"
            />
            <TextField
              label="Password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              secure
              leftIcon={Lock}
              autoComplete="current-password"
            />
            <Checkbox checked={require2fa} onChange={setRequire2fa} label="Require 2FA code" />
            <Button type="submit" label="Sign in" loading={loading} fullWidth size="lg" />
          </form>
        </Card>
      </div>
    </div>
  );
}
