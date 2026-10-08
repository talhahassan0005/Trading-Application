/**
 * Tournaments store — fully cosmetic demo data. Joining debits the (simulated) entry fee
 * from the active wallet; nothing is ever paid out, and the note in the UI says so.
 */
import { create } from 'zustand';
import { useWalletStore } from './wallet';

export interface Tournament {
  id: string;
  title: string;
  prizePool: number;
  entryFee: number;
  durationLabel: string;
  status: 'active' | 'completed';
  startsInLabel?: string; // active only
}

export const TOURNAMENTS: Tournament[] = [
  { id: 't1', title: 'Crazy Wednesday', prizePool: 7500, entryFee: 10, durationLabel: '1 day', status: 'active' },
  { id: 't2', title: 'Free Friday', prizePool: 1000, entryFee: 0, durationLabel: '1 day', status: 'active', startsInLabel: '1 day(s)' },
  { id: 't3', title: 'Weekend Battle', prizePool: 5000, entryFee: 1, durationLabel: '2 days', status: 'active', startsInLabel: '2 day(s)' },
  { id: 't4', title: 'Monthly Cup', prizePool: 15000, entryFee: 25, durationLabel: '30 days', status: 'active', startsInLabel: '6 day(s)' },
  { id: 't5', title: 'Weekend Battle', prizePool: 5000, entryFee: 1, durationLabel: '2 days', status: 'completed' },
  { id: 't6', title: 'Crazy Wednesday', prizePool: 9000, entryFee: 10, durationLabel: '1 day', status: 'completed' },
];

interface TournamentsState {
  joined: Set<string>;
  join: (id: string) => { ok: true } | { ok: false; error: string };
}

export const useTournamentsStore = create<TournamentsState>((set, get) => ({
  joined: new Set(),
  join: (id) => {
    if (get().joined.has(id)) return { ok: false, error: 'You already joined this tournament.' };
    const t = TOURNAMENTS.find((x) => x.id === id);
    if (!t) return { ok: false, error: 'Tournament not found.' };
    if (t.entryFee > 0 && !useWalletStore.getState().debit(t.entryFee, `Tournament entry · ${t.title}`, 'trade-stake')) {
      return { ok: false, error: 'Insufficient balance for the entry fee.' };
    }
    set((s) => ({ joined: new Set(s.joined).add(id) }));
    return { ok: true };
  },
}));
