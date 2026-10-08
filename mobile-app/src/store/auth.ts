/** Auth store — fully mocked; no backend. Any well-formed input is accepted. */
import { create } from 'zustand';
import { useUiStore } from './ui';

/** Fresh session: bring the deposit banner back. */
const freshSession = () => useUiStore.getState().resetBonus();

export interface User {
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  /** Sign-up waiting for its OTP. */
  pending: User | null;
  signIn: (email: string, password: string) => string | null;
  signUp: (email: string, password: string) => string | null;
  verifyCode: (code: string) => string | null;
  signInWithGoogle: () => void;
  signOut: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  pending: null,

  signIn: (email, password) => {
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    const e = email.trim();
    freshSession();
    set({ user: { name: e.split('@')[0], email: e } });
    return null;
  },

  signUp: (email, password) => {
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    const e = email.trim();
    // The sign-up form collects no name, so it's derived from the email like sign-in does.
    set({ pending: { name: e.split('@')[0], email: e } });
    return null;
  },

  verifyCode: (code) => {
    const { pending } = get();
    if (!pending) return 'Session expired. Please sign up again.';
    if (!/^\d{6}$/.test(code)) return 'Enter the 6-digit code.';
    freshSession();
    set({ user: pending, pending: null }); // demo: any 6 digits are accepted
    return null;
  },

  signInWithGoogle: () => {
    freshSession();
    set({ user: { name: 'Demo Trader', email: 'demo@trynex.app' } });
  },
  signOut: () => {
    freshSession();
    set({ user: null, pending: null });
  },
}));
