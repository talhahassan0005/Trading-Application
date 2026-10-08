/** Profile store — account/personal-data settings shown on the Profile screen. Demo only. */
import { create } from 'zustand';

export interface Security {
  twoStepEmail: boolean;
  enterPlatform: boolean;
  withdrawFunds: boolean;
}

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
  update: (patch: Partial<Omit<ProfileState, 'security' | 'cards' | 'update' | 'setSecurity' | 'addCard'>>) => void;
  setSecurity: (patch: Partial<Security>) => void;
  addCard: (last4: string) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  nickname: '',
  firstName: '',
  lastName: '',
  dateOfBirth: null,
  country: null,
  address: '',
  language: 'English',
  timezone: 'UTC+00:00',
  security: { twoStepEmail: true, enterPlatform: true, withdrawFunds: true },
  cards: [],
  update: (patch) => set(patch),
  setSecurity: (patch) => set((s) => ({ security: { ...s.security, ...patch } })),
  addCard: (last4) => set((s) => ({ cards: [...s.cards, last4] })),
}));
