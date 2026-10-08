/**
 * Promo codes — real (if small) functionality: a matched code credits a bonus to the demo
 * wallet only, since there's no real money in this app to discount against. Not tied to any
 * actual marketing system.
 */
import { create } from 'zustand';
import { useWalletStore } from './wallet';

export interface PromoCode {
  code: string;
  amount: number;
  label: string;
}

export const PROMO_CODES: PromoCode[] = [
  { code: 'WELCOME10', amount: 10, label: 'Welcome bonus' },
  { code: 'RISKFREE5', amount: 5, label: 'Risk-free bonus' },
  { code: 'TRYNEX25', amount: 25, label: 'Launch bonus' },
];

interface PromoState {
  redeemed: string[];
  redeem: (code: string) => { ok: true; amount: number } | { ok: false; error: string };
}

export const usePromoStore = create<PromoState>((set, get) => ({
  redeemed: [],
  redeem: (raw) => {
    const code = raw.trim().toUpperCase();
    if (!code) return { ok: false, error: 'Enter a promo code.' };
    if (get().redeemed.includes(code)) return { ok: false, error: 'You already redeemed this code.' };
    const promo = PROMO_CODES.find((p) => p.code === code);
    if (!promo) return { ok: false, error: 'That code is not valid.' };
    set((s) => ({ redeemed: [...s.redeemed, code] }));
    useWalletStore.getState().credit(promo.amount, `Promo · ${promo.label}`, 'trade-win', 'demo');
    return { ok: true, amount: promo.amount };
  },
}));
