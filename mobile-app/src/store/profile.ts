/**
 * Profile store — personal data (saved to the backend) plus device-only preferences
 * (language, timezone, security toggles, demo cards).
 */
import { create } from 'zustand';
import * as api from '../api/backend';

export interface Security {
  twoStepEmail: boolean;
  enterPlatform: boolean;
  withdrawFunds: boolean;
}

type Editable = Pick<ProfileState, 'nickname' | 'firstName' | 'lastName' | 'dateOfBirth' | 'country' | 'address' | 'language' | 'timezone'>;

interface ProfileState {
  nickname: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null; // "YYYY-MM-DD"
  country: string | null;
  address: string;
  language: string;
  timezone: string;
  security: Security;
  cards: string[]; // last-4 digits of any "added" demo cards
  /** An account-deletion request is waiting for staff review. */
  deletionPending: boolean;
  update: (patch: Partial<Editable>) => void;
  setSecurity: (patch: Partial<Security>) => void;
  addCard: (last4: string) => void;
  hydrate: (p: api.Profile) => void;
  save: (userId: string) => Promise<string | null>;
  loadDeletion: (userId: string) => Promise<void>;
  requestDeletion: (reason: string) => Promise<string | null>;
  cancelDeletion: () => Promise<string | null>;
  reset: () => void;
}

const EMPTY_PERSONAL = { nickname: '', firstName: '', lastName: '', dateOfBirth: null, country: null, address: '' };

const messageOf = (e: unknown) =>
  e instanceof api.BackendError ? e.message : 'No connection to the server. Check your internet and try again.';

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...EMPTY_PERSONAL,
  language: 'English',
  timezone: 'UTC+00:00',
  security: { twoStepEmail: true, enterPlatform: true, withdrawFunds: true },
  cards: [],
  deletionPending: false,

  update: (patch) => set(patch),
  setSecurity: (patch) => set((s) => ({ security: { ...s.security, ...patch } })),
  addCard: (last4) => set((s) => ({ cards: [...s.cards, last4] })),

  hydrate: (p) =>
    set({
      nickname: p.nickname,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      country: p.country,
      address: p.address,
    }),

  save: async (userId) => {
    const { nickname, firstName, lastName, dateOfBirth, country, address } = get();
    try {
      await api.updatePersonalData(userId, { nickname, firstName, lastName, dateOfBirth, country, address });
      return null;
    } catch (e) {
      return messageOf(e);
    }
  },

  loadDeletion: async (userId) => {
    const req = await api.fetchPendingDeletion(userId).catch(() => null);
    set({ deletionPending: !!req });
  },

  requestDeletion: async (reason) => {
    try {
      await api.requestAccountDeletion(reason);
      set({ deletionPending: true });
      return null;
    } catch (e) {
      return messageOf(e);
    }
  },

  cancelDeletion: async () => {
    try {
      await api.cancelAccountDeletion();
      set({ deletionPending: false });
      return null;
    } catch (e) {
      return messageOf(e);
    }
  },

  reset: () => set({ ...EMPTY_PERSONAL, cards: [], deletionPending: false }),
}));
