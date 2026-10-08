/**
 * Wallet store — the ONE place balance logic lives (simulated money only).
 * A real backend/ledger can later replace these actions without touching the
 * screens or the trades store.
 *
 * Deposits are never credited instantly: they start `pending` and only credit
 * once confirmed. Withdrawals hold the funds immediately and then walk
 * requested -> under review -> paid.
 */
import { create } from 'zustand';
import { PAYMENT_METHODS, PayMethod } from '../data/paymentMethods';
import { notify } from './notifications';

export type WalletMode = 'demo' | 'real';
export type TxType = 'deposit' | 'withdrawal' | 'trade-win' | 'trade-loss' | 'trade-stake';
export type TxStatus = 'pending' | 'reviewing' | 'completed';
export type { PayMethod };

/** Withdrawal timeline stage: 0 requested (funds held), 1 under review, 2 paid. */
export type WithdrawStage = 0 | 1 | 2;

export interface Transaction {
  id: string;
  wallet: WalletMode;
  type: TxType;
  amount: number; // signed effect on the balance once completed
  status: TxStatus;
  label: string;
  method?: PayMethod;
  stage?: WithdrawStage; // withdrawals only
  createdAt: number;
}

interface WalletState {
  mode: WalletMode;
  balances: Record<WalletMode, number>;
  /** Funds reserved by in-flight withdrawals (already deducted from the balance). */
  held: Record<WalletMode, number>;
  transactions: Transaction[];
  /** Last deposit method/amount used, per wallet mode — drives the "Last used / Repeat" row. */
  lastDeposit: Partial<Record<WalletMode, { method: PayMethod; amount: number }>>;
  setMode: (mode: WalletMode) => void;
  debit: (amount: number, label: string, type?: TxType) => boolean;
  /** `wallet` defaults to the active mode; trades pass the wallet they were opened in. */
  credit: (amount: number, label: string, type?: TxType, wallet?: WalletMode) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'wallet'>, wallet?: WalletMode) => string;
  requestDeposit: (amount: number, method: PayMethod) => string;
  confirmDeposit: (id: string) => void;
  requestWithdrawal: (amount: number, method: PayMethod) => { ok: true } | { ok: false; error: string };
}

// Simulated review pipeline timings (ms after the request).
const REVIEW_AFTER = 6_000;
const PAID_AFTER = 16_000;

let seq = 0;
const nextId = () => `tx_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export const METHOD_LABEL: Record<PayMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.id, m.label]),
) as Record<PayMethod, string>;

export const useWalletStore = create<WalletState>((set, get) => {
  const patchTx = (id: string, patch: Partial<Transaction>) =>
    set((s) => ({ transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const adjust = (wallet: WalletMode, delta: number) =>
    set((s) => ({ balances: { ...s.balances, [wallet]: s.balances[wallet] + delta } }));

  return {
    mode: 'demo',
    balances: { demo: 10_000, real: 0 },
    held: { demo: 0, real: 0 },
    transactions: [],
    lastDeposit: {},

    setMode: (mode) => set({ mode }),

    debit: (amount, label, type = 'trade-stake') => {
      const { mode, balances } = get();
      if (amount <= 0 || balances[mode] < amount) return false;
      adjust(mode, -amount);
      get().addTransaction({ type, amount: -amount, status: 'completed', label });
      return true;
    },

    credit: (amount, label, type = 'trade-win', wallet = get().mode) => {
      adjust(wallet, amount);
      get().addTransaction({ type, amount, status: 'completed', label }, wallet);
    },

    addTransaction: (tx, wallet) => {
      const id = nextId();
      set((s) => ({
        transactions: [{ ...tx, id, wallet: wallet ?? s.mode, createdAt: Date.now() }, ...s.transactions],
      }));
      return id;
    },

    // Pending until the payment is confirmed — the balance is NOT touched here.
    requestDeposit: (amount, method) => {
      const { mode } = get();
      set((s) => ({ lastDeposit: { ...s.lastDeposit, [mode]: { method, amount } } }));
      return get().addTransaction({
        type: 'deposit',
        amount,
        status: 'pending',
        method,
        label: `Deposit · ${METHOD_LABEL[method]}`,
      });
    },

    // Stand-in for the payment provider's confirmation webhook.
    confirmDeposit: (id) => {
      const tx = get().transactions.find((t) => t.id === id);
      if (!tx || tx.type !== 'deposit' || tx.status !== 'pending') return;
      adjust(tx.wallet, tx.amount);
      patchTx(id, { status: 'completed' });
      notify({ kind: 'info', title: 'Deposit confirmed', body: `$${tx.amount.toFixed(2)} was added to your ${tx.wallet} wallet.` });
    },

    requestWithdrawal: (amount, method) => {
      const { mode, balances } = get();
      if (!(amount > 0)) return { ok: false, error: 'Enter a valid amount.' };
      if (amount > balances[mode]) return { ok: false, error: 'Amount exceeds your available balance.' };

      adjust(mode, -amount); // funds are held straight away
      set((s) => ({ held: { ...s.held, [mode]: s.held[mode] + amount } }));
      const id = get().addTransaction({
        type: 'withdrawal',
        amount: -amount,
        status: 'pending',
        method,
        stage: 0,
        label: `Withdrawal · ${METHOD_LABEL[method]}`,
      });

      setTimeout(() => {
        patchTx(id, { status: 'reviewing', stage: 1 });
        notify({ kind: 'info', title: 'Withdrawal under review', body: `Your $${amount.toFixed(2)} request is being reviewed.` });
      }, REVIEW_AFTER);
      setTimeout(() => {
        patchTx(id, { status: 'completed', stage: 2 });
        notify({ kind: 'info', title: 'Withdrawal paid', body: `$${amount.toFixed(2)} has been paid out.` });
        set((s) => ({ held: { ...s.held, [mode]: Math.max(0, s.held[mode] - amount) } }));
      }, PAID_AFTER);
      return { ok: true };
    },
  };
});
