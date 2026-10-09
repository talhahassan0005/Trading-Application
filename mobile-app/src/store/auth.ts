/** Auth store — real accounts through the backend service (src/api/backend.ts). */
import { Alert } from 'react-native';
import { create } from 'zustand';
import * as api from '../api/backend';
import { useKycStore } from './kyc';
import { useProfileStore } from './profile';
import { useUiStore } from './ui';

/** Fresh session: bring the deposit banner back. */
const freshSession = () => useUiStore.getState().resetBonus();

export interface User {
  id: string;
  name: string;
  email: string;
  accountNo: number;
}

export interface AuthResult {
  error?: string;
  /** Sign-up (or an unconfirmed sign-in) is waiting for the emailed 6-digit code. */
  needsCode?: boolean;
}

interface AuthState {
  /** False until the saved session has been checked on app start. */
  ready: boolean;
  user: User | null;
  /** Email waiting for its sign-up code. */
  pending: { email: string } | null;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, details: api.SignUpDetails) => Promise<AuthResult>;
  verifyCode: (code: string) => Promise<string | null>;
  resendCode: () => Promise<string | null>;
  /** Forgot password, step 1: email a reset code. */
  requestPasswordReset: (email: string) => Promise<string | null>;
  /** Step 2: check the code, set the new password and sign in. */
  resetPassword: (email: string, code: string, newPassword: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const messageOf = (e: unknown) =>
  e instanceof api.BackendError ? e.message : 'No connection to the server. Check your internet and try again.';

function validate(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

let stopProfileSync: (() => void) | null = null;

function clearLocalSession() {
  stopProfileSync?.();
  stopProfileSync = null;
  useProfileStore.getState().reset();
  useKycStore.getState().reset();
}

export const useAuthStore = create<AuthState>((set, get) => {
  /** Loads the profile for a signed-in auth user; refuses frozen accounts. Returns an error message or null. */
  async function startSession(authUser: { id: string }): Promise<string | null> {
    const profile = await api.fetchMyProfile(authUser.id);
    if (profile.status === 'frozen') {
      await api.signOut();
      return api.FROZEN_MESSAGE;
    }

    useProfileStore.getState().hydrate(profile);
    useKycStore.getState().setStatus(profile.kycStatus);
    void useKycStore.getState().load(profile.id);
    void useProfileStore.getState().loadDeletion(profile.id);

    stopProfileSync?.();
    stopProfileSync = api.subscribeToMyProfile(profile.id, (p) => {
      if (p.status === 'frozen') {
        Alert.alert('Account frozen', api.FROZEN_MESSAGE);
        void get().signOut();
        return;
      }
      useKycStore.getState().setStatus(p.kycStatus, p.id);
    });

    freshSession();
    set({ user: { id: profile.id, name: profile.name, email: profile.email, accountNo: profile.accountNo }, pending: null });
    return null;
  }

  return {
    ready: false,
    user: null,
    pending: null,

    init: async () => {
      // Session ended elsewhere (signed out, revoked, account deleted by an admin).
      api.onSignedOut(() => {
        clearLocalSession();
        set({ user: null });
      });
      try {
        const authUser = await api.currentUser();
        if (authUser) await startSession(authUser);
      } catch {
        // Offline or the account no longer exists: fall through to the sign-in screen.
      } finally {
        set({ ready: true });
      }
    },

    signIn: async (rawEmail, password) => {
      const email = rawEmail.trim().toLowerCase();
      const invalid = validate(email, password);
      if (invalid) return { error: invalid };
      try {
        const result = await api.signIn(email, password);
        if (result.kind === 'needs-code') {
          set({ pending: { email } });
          return { needsCode: true };
        }
        const error = await startSession(result.user);
        return error ? { error } : {};
      } catch (e) {
        return { error: messageOf(e) };
      }
    },

    signUp: async (rawEmail, password, details) => {
      const email = rawEmail.trim().toLowerCase();
      const invalid = validate(email, password);
      if (invalid) return { error: invalid };
      try {
        const user = await api.signUp(email, password, details);
        if (user) {
          // Email confirmation is switched off in Supabase: the account is ready immediately.
          const error = await startSession(user);
          return error ? { error } : {};
        }
        set({ pending: { email } });
        return { needsCode: true };
      } catch (e) {
        return { error: messageOf(e) };
      }
    },

    verifyCode: async (code) => {
      const { pending } = get();
      if (!pending) return 'Session expired. Please sign up again.';
      if (!/^\d{6}$/.test(code)) return 'Enter the 6-digit code.';
      try {
        const user = await api.verifyEmailCode(pending.email, code);
        return await startSession(user);
      } catch (e) {
        return messageOf(e);
      }
    },

    resendCode: async () => {
      const { pending } = get();
      if (!pending) return 'Session expired. Please sign up again.';
      try {
        await api.resendSignUpCode(pending.email);
        return null;
      } catch (e) {
        return messageOf(e);
      }
    },

    requestPasswordReset: async (rawEmail) => {
      const email = rawEmail.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
      try {
        await api.sendPasswordResetCode(email);
        return null;
      } catch (e) {
        return messageOf(e);
      }
    },

    resetPassword: async (rawEmail, code, newPassword) => {
      const email = rawEmail.trim().toLowerCase();
      if (!/^\d{6}$/.test(code)) return 'Enter the 6-digit code from the email.';
      if (newPassword.length < 6) return 'Password must be at least 6 characters.';
      try {
        const user = await api.resetPassword(email, code, newPassword);
        return await startSession(user);
      } catch (e) {
        return messageOf(e);
      }
    },

    signOut: async () => {
      freshSession();
      clearLocalSession();
      set({ user: null, pending: null });
      await api.signOut();
    },
  };
});
