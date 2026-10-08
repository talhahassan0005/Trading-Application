/** Tradable instruments (all prices are simulated). */
export type Category = 'Crypto' | 'Forex' | 'Stocks' | 'Commodities';

export interface Asset {
  symbol: string; // unique id, e.g. "EUR/USD"
  category: Category;
  basePrice: number; // the level the simulated price reverts around
  decimals: number;
  payout: number; // 0.85 => a win returns stake * 1.85
  volatility: number; // multiplier on the OU sigma
  /**
   * True for the handful of pairs that track real market hours: while their market is
   * open they move like a live session (small, steady % changes); outside those hours
   * they fall back to the OTC pattern below. Everything else is OTC all the time, like
   * most of a real OTC broker's pair list.
   */
  realMarket?: boolean;
}

export const DEFAULT_PAYOUT = 0.85;

export const ASSETS: Asset[] = [
  { symbol: 'BTC/USD', category: 'Crypto', basePrice: 64000, decimals: 2, payout: 0.85, volatility: 4 },
  { symbol: 'ETH/USD', category: 'Crypto', basePrice: 3200, decimals: 2, payout: 0.85, volatility: 4 },
  { symbol: 'SOL/USD', category: 'Crypto', basePrice: 150, decimals: 2, payout: 0.82, volatility: 5 },
  { symbol: 'XRP/USD', category: 'Crypto', basePrice: 0.55, decimals: 4, payout: 0.8, volatility: 5 },
  { symbol: 'EUR/USD', category: 'Forex', basePrice: 1.085, decimals: 5, payout: 0.85, volatility: 1, realMarket: true },
  { symbol: 'GBP/USD', category: 'Forex', basePrice: 1.27, decimals: 5, payout: 0.85, volatility: 1.1, realMarket: true },
  { symbol: 'USD/JPY', category: 'Forex', basePrice: 149.5, decimals: 3, payout: 0.84, volatility: 1.1, realMarket: true },
  { symbol: 'AUD/USD', category: 'Forex', basePrice: 0.66, decimals: 5, payout: 0.83, volatility: 1.2 },
  { symbol: 'USD/CAD', category: 'Forex', basePrice: 1.36, decimals: 5, payout: 0.83, volatility: 1 },
  { symbol: 'AAPL', category: 'Stocks', basePrice: 190, decimals: 2, payout: 0.8, volatility: 2, realMarket: true },
  { symbol: 'TSLA', category: 'Stocks', basePrice: 245, decimals: 2, payout: 0.8, volatility: 3.5 },
  { symbol: 'MSFT', category: 'Stocks', basePrice: 420, decimals: 2, payout: 0.8, volatility: 2 },
  { symbol: 'NVDA', category: 'Stocks', basePrice: 900, decimals: 2, payout: 0.8, volatility: 3 },
  { symbol: 'XAU/USD', category: 'Commodities', basePrice: 2350, decimals: 2, payout: 0.86, volatility: 1.8, realMarket: true },
  { symbol: 'XAG/USD', category: 'Commodities', basePrice: 28, decimals: 3, payout: 0.84, volatility: 2.5 },
  { symbol: 'WTI Oil', category: 'Commodities', basePrice: 78, decimals: 2, payout: 0.84, volatility: 2.5 },
];

export const CATEGORIES: Array<'All' | Category> = ['All', 'Crypto', 'Forex', 'Stocks', 'Commodities'];

export function getAsset(symbol: string): Asset {
  return ASSETS.find((a) => a.symbol === symbol) ?? ASSETS[4];
}

/**
 * Approximate real-market hours (UTC), used only to decide whether a pair is
 * shown as "OTC". Crypto never closes; forex/commodities close for the weekend;
 * stocks trade roughly 13:30–20:00 UTC on weekdays. Holidays/DST are ignored.
 */
export function isMarketOpen(category: Category, now: Date = new Date()): boolean {
  if (category === 'Crypto') return true;
  const day = now.getUTCDay(); // 0 = Sun
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (category === 'Stocks') {
    return day >= 1 && day <= 5 && minutes >= 13 * 60 + 30 && minutes < 20 * 60;
  }
  // Forex + commodities: closed Fri 22:00 UTC -> Sun 22:00 UTC
  if (day === 6) return false;
  if (day === 5 && minutes >= 22 * 60) return false;
  if (day === 0 && minutes < 22 * 60) return false;
  return true;
}

/** True when the pair runs on the self-generated OTC feed (higher, punchier moves). */
export function isOtc(asset: Asset, now?: Date): boolean {
  return !asset.realMarket || !isMarketOpen(asset.category, now);
}

/** "EUR/USD (OTC)" while the real market is closed. */
export function displayName(asset: Asset, now?: Date): string {
  return isOtc(asset, now) ? `${asset.symbol} (OTC)` : asset.symbol;
}
