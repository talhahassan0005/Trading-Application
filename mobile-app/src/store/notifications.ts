/** In-app notifications (trade results, deposits, withdrawals, verification). */
import { create } from 'zustand';

export type NoticeKind = 'win' | 'loss' | 'info';

export interface Notice {
  id: string;
  kind: NoticeKind;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

interface NotificationsState {
  items: Notice[];
  push: (n: { kind: NoticeKind; title: string; body: string }) => void;
  markAllRead: () => void;
}

let seq = 0;

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  push: (n) =>
    set((s) => ({ items: [{ ...n, id: `n_${Date.now().toString(36)}_${seq++}`, at: Date.now(), read: false }, ...s.items].slice(0, 100) })),
  markAllRead: () => set((s) => ({ items: s.items.map((i) => (i.read ? i : { ...i, read: true })) })),
}));

/** Non-hook helper so stores can post notifications. */
export const notify = (n: { kind: NoticeKind; title: string; body: string }) => useNotificationsStore.getState().push(n);
