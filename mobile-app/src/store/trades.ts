/**
 * Trades store — mock trading engine.
 *  - placeTrade locks the entry price from the OTC feed and debits the stake.
 *  - a timer settles the position at expiry: win => stake * (1 + payout)
 *    (1.85x at the default 85 %), loss => stake is forfeited, tie => refund.
 * All money movement goes through the wallet store.
 */
import { create } from 'zustand';
import { getAsset } from '../data/assets';
import { getPrice } from '../data/otcFeed';
import { notify } from './notifications';
import { WalletMode, useWalletStore } from './wallet';

export type Direction = 'up' | 'down';
export type TradeStatus = 'open' | 'won' | 'lost' | 'push';

export interface Position {
  id: string;
  symbol: string;
  wallet: WalletMode; // wallet the stake came from; settlement pays back into it
  direction: Direction;
  stake: number;
  payout: number; // e.g. 0.85
  entry: number;
  exit?: number;
  openedAt: number;
  expiresAt: number;
  status: TradeStatus;
  pnl?: number; // set on settlement
}

interface PlaceArgs {
  symbol: string;
  direction: Direction;
  stake: number;
  expirySeconds: number;
}

interface TradesState {
  positions: Position[];
  placeTrade: (args: PlaceArgs) => { ok: true; entry: number } | { ok: false; error: string };
}

/** P/L if the position settled at `price` right now. */
export function projectedPnl(p: Position, price: number): number {
  if (price === p.entry) return 0;
  const winning = p.direction === 'up' ? price > p.entry : price < p.entry;
  return winning ? p.stake * p.payout : -p.stake;
}

export const useTradesStore = create<TradesState>((set, get) => {
  const settle = (id: string) => {
    const p = get().positions.find((x) => x.id === id);
    if (!p || p.status !== 'open') return;
    const exit = getPrice(p.symbol);
    const pnl = projectedPnl(p, exit);
    const status: TradeStatus = pnl > 0 ? 'won' : pnl < 0 ? 'lost' : 'push';
    const wallet = useWalletStore.getState();
    if (status === 'won') wallet.credit(p.stake * (1 + p.payout), `Win ${p.symbol}`, 'trade-win', p.wallet);
    else if (status === 'push') wallet.credit(p.stake, `Refund ${p.symbol}`, 'trade-win', p.wallet);
    else wallet.addTransaction({ type: 'trade-loss', amount: 0, status: 'completed', label: `Loss ${p.symbol}` }, p.wallet);
    set((s) => ({ positions: s.positions.map((x) => (x.id === id ? { ...x, status, exit, pnl } : x)) }));
    const amt = Math.abs(pnl).toFixed(2);
    notify(
      status === 'won'
        ? { kind: 'win', title: `Trade won +$${amt}`, body: `${p.symbol} · ${p.direction.toUpperCase()} · $${p.stake.toFixed(2)} stake` }
        : status === 'lost'
          ? { kind: 'loss', title: `Trade lost -$${amt}`, body: `${p.symbol} · ${p.direction.toUpperCase()} · $${p.stake.toFixed(2)} stake` }
          : { kind: 'info', title: 'Trade closed at entry price', body: `${p.symbol} · stake of $${p.stake.toFixed(2)} refunded` },
    );
  };

  return {
    positions: [],
    placeTrade: ({ symbol, direction, stake, expirySeconds }) => {
      if (stake <= 0) return { ok: false, error: 'Enter a valid amount.' };
      const wallet = useWalletStore.getState();
      if (!wallet.debit(stake, `Stake ${symbol}`, 'trade-stake')) {
        return { ok: false, error: 'Insufficient balance.' };
      }
      const now = Date.now();
      const entry = getPrice(symbol); // locked entry price
      const position: Position = {
        id: `pos_${now.toString(36)}_${get().positions.length}`,
        symbol,
        wallet: wallet.mode,
        direction,
        stake,
        payout: getAsset(symbol).payout,
        entry,
        openedAt: now,
        expiresAt: now + expirySeconds * 1000,
        status: 'open',
      };
      set((s) => ({ positions: [position, ...s.positions] }));
      setTimeout(() => settle(position.id), expirySeconds * 1000);
      return { ok: true, entry };
    },
  };
});
