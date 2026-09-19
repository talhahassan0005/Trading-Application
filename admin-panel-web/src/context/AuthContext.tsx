import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AdminUser } from '../types/models';
import { mockAdmin } from '../api/mockData';

interface AuthContextValue {
  admin: AdminUser | null;
  signIn: (email: string, password: string, require2fa: boolean) => Promise<void>;
  signOut: () => void;
}

const STORAGE_KEY = 'vertex_admin.session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AdminUser) : null;
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      // Demo/simulated auth — accepts any non-empty credentials, no real backend.
      signIn: async (email) => {
        await new Promise((r) => setTimeout(r, 300));
        const session: AdminUser = { ...mockAdmin, email: email || mockAdmin.email };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setAdmin(session);
      },
      signOut: () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setAdmin(null);
      },
    }),
    [admin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
