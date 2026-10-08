/** KYC store — mocked verification checklist. */
import { create } from 'zustand';
import { notify } from './notifications';

export type KycKey = 'email' | 'phone' | 'id' | 'address';
export type KycStatus = 'todo' | 'pending' | 'verified';

interface KycState {
  items: Record<KycKey, KycStatus>;
  submit: (key: KycKey) => void;
}

const LABEL: Record<KycKey, string> = { email: 'email', phone: 'phone', id: 'ID document', address: 'proof of address' };
const REVIEW_MS = 5_000; // simulated review time

export const useKycStore = create<KycState>((set) => ({
  items: { email: 'verified', phone: 'todo', id: 'todo', address: 'todo' },
  submit: (key) => {
    set((s) => ({ items: { ...s.items, [key]: 'pending' } }));
    setTimeout(() => {
      set((s) => ({ items: { ...s.items, [key]: 'verified' } }));
      notify({ kind: 'info', title: 'Verification approved', body: `Your ${LABEL[key]} check is complete.` });
    }, REVIEW_MS);
  },
}));
