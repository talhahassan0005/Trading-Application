import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminUser } from '../types/models';
import { backendConfigured, supabase } from '../api/supabase';

interface AuthContextValue {
  admin: AdminUser | null;
  /** False until the saved session has been checked. */
  ready: boolean;
  /** Throws an Error with a user-facing message on failure. */
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NOT_STAFF = 'This account does not have admin access.';

/** Staff profile for a signed-in auth user, or null if they are not an admin. */
async function loadAdmin(userId: string): Promise<AdminUser | null> {
  const { data } = await supabase
    .from('profiles')
    .select('email, name, first_name, last_name, role')
    .eq('id', userId)
    .maybeSingle();
  if (!data || data.role !== 'admin') return null;
  return {
    name: `${data.first_name} ${data.last_name}`.trim() || data.name,
    email: data.email,
    role: 'Admin',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(!backendConfigured);

  useEffect(() => {
    if (!backendConfigured) return;
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      const staff = user ? await loadAdmin(user.id) : null;
      if (user && !staff) await supabase.auth.signOut();
      if (!active) return;
      setAdmin(staff);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setAdmin(null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      ready,
      signIn: async (email, password) => {
        if (!backendConfigured) {
          throw new Error('Backend not configured. Add your Supabase keys to admin-panel-web/.env.local and restart.');
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) {
          throw new Error(/invalid login credentials/i.test(error.message) ? 'Incorrect email or password.' : error.message);
        }
        const staff = await loadAdmin(data.user.id);
        if (!staff) {
          await supabase.auth.signOut();
          throw new Error(NOT_STAFF);
        }
        setAdmin(staff);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setAdmin(null);
      },
    }),
    [admin, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
