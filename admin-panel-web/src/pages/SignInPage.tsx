import { useState, type FormEvent } from 'react';
import { Sun, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { backendConfigured } from '../api/supabase';
import { Text, Card, TextField, Button } from '../components';

export function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
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
            {error ? (
              <Text variant="bodySmall" color="text-danger">
                {error}
              </Text>
            ) : null}
            {!backendConfigured ? (
              <Text variant="bodySmall" color="text-warning">
                Not connected to the backend yet: add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to
                admin-panel-web/.env.local, then restart the dev server.
              </Text>
            ) : null}
            <Button type="submit" label="Sign in" loading={loading} fullWidth size="lg" />
          </form>
        </Card>
      </div>
    </div>
  );
}
