/** Tradable instruments (all prices are simulated). */
import { MARKET_HOURS_TEXT, Market, isMarketOpen } from './marketHours';

export type Category = 'Forex' | 'Crypto' | 'Commodities' | 'Stocks' | 'Indices';

export interface Asset {
  symbol: string; // unique id, e.g. "EUR/USD" or "AAPL"
  /** Display name for non-pair instruments, e.g. "Apple" or "Gold". */
  name?: string;
  category: Category;
  basePrice: number; // the level the simulated price reverts around
  decimals: number;
  payout: number; // 0.85 => a win returns stake * 1.85
  volatility: number; // multiplier on the OU sigma
  /**
   * Which real market the instrument follows. While that market is open it moves like a
   * live session (small, steady % changes); once it closes the same instrument switches
   * to "(OTC)" and the punchier OTC pattern. 'otc' instruments are OTC all the time.
   */
  market: Market;
  /** Icon glyph for instruments that aren't currency pairs (flag, emoji or letter). */
  icon?: string;
}

export const DEFAULT_PAYOUT = 0.85;

/** ~5-6 significant digits, like a broker quote (tiny exotic rates get extra decimals). */
const fxDecimals = (price: number) =>
  price >= 1000 ? 2 : price >= 100 ? 3 : price >= 10 ? 4 : price >= 0.01 ? 5 : Math.ceil(-Math.log10(price)) + 3;

/** Real-market currency pair (OTC on weekends). */
const fx = (symbol: string, basePrice: number, payout = 0.85, volatility = 1): Asset => ({
  symbol,
  category: 'Forex',
  basePrice,
  decimals: fxDecimals(basePrice),
  payout,
  volatility,
  market: 'fx',
});

/** OTC-only currency pair (exotics offered by OTC brokers around the clock). */
const fxOtc = (symbol: string, basePrice: number, payout = 0.88, volatility = 1.2): Asset => ({
  ...fx(symbol, basePrice, payout, volatility),
  market: 'otc',
});

const crypto = (symbol: string, name: string, basePrice: number, decimals: number, payout = 0.85, volatility = 4): Asset => ({
  symbol,
  name,
  category: 'Crypto',
  basePrice,
  decimals,
  payout,
  volatility,
  market: 'crypto',
});

const commodity = (symbol: string, name: string, icon: string, basePrice: number, decimals: number, payout = 0.85, volatility = 1.8): Asset => ({
  symbol,
  name,
  icon,
  category: 'Commodities',
  basePrice,
  decimals,
  payout,
  volatility,
  market: 'futures',
});

const stock = (symbol: string, name: string, basePrice: number, payout = 0.82, volatility = 2.2): Asset => ({
  symbol,
  name,
  category: 'Stocks',
  basePrice,
  decimals: 2,
  payout,
  volatility,
  market: 'us-stocks',
});

const index = (symbol: string, name: string, icon: string, market: Market, basePrice: number, payout = 0.83, volatility = 1.5): Asset => ({
  symbol,
  name,
  icon,
  category: 'Indices',
  basePrice,
  decimals: 2,
  payout,
  volatility,
  market,
});

export const ASSETS: Asset[] = [
  // --- Forex: majors -------------------------------------------------------------
  fx('EUR/USD', 1.17, 0.85),
  fx('GBP/USD', 1.34, 0.85, 1.1),
  fx('USD/JPY', 148.5, 0.85, 1.1),
  fx('USD/CHF', 0.8, 0.84),
  fx('AUD/USD', 0.66, 0.85, 1.2),
  fx('USD/CAD', 1.38, 0.84),
  fx('NZD/USD', 0.59, 0.84, 1.2),
  // --- Forex: crosses --------------------------------------------------------------
  fx('EUR/GBP', 0.873, 0.83),
  fx('EUR/JPY', 173.8, 0.84, 1.2),
  fx('EUR/CHF', 0.936, 0.82),
  fx('EUR/AUD', 1.773, 0.83, 1.2),
  fx('EUR/CAD', 1.615, 0.83),
  fx('EUR/NZD', 1.983, 0.82, 1.2),
  fx('GBP/JPY', 199, 0.84, 1.3),
  fx('GBP/CHF', 1.072, 0.82, 1.1),
  fx('GBP/AUD', 2.03, 0.83, 1.2),
  fx('GBP/CAD', 1.849, 0.83, 1.1),
  fx('GBP/NZD', 2.271, 0.82, 1.3),
  fx('AUD/JPY', 98, 0.84, 1.3),
  fx('AUD/CAD', 0.911, 0.83, 1.1),
  fx('AUD/CHF', 0.528, 0.82, 1.1),
  fx('AUD/NZD', 1.119, 0.82),
  fx('CAD/JPY', 107.6, 0.83, 1.1),
  fx('CAD/CHF', 0.58, 0.82),
  fx('CHF/JPY', 185.6, 0.83, 1.1),
  fx('NZD/JPY', 87.6, 0.83, 1.3),
  fx('NZD/CAD', 0.814, 0.82, 1.1),
  fx('NZD/CHF', 0.472, 0.82, 1.1),
  // --- Forex: exotics with a real market --------------------------------------------
  fx('EUR/SGD', 1.508, 0.8),
  fx('USD/SGD', 1.289, 0.8),
  fx('USD/HKD', 7.78, 0.78, 0.4),
  fx('USD/CNH', 7.12, 0.8, 0.7),
  fx('USD/SEK', 9.42, 0.8, 1.2),
  fx('USD/NOK', 10.02, 0.8, 1.2),
  fx('USD/DKK', 6.38, 0.8),
  fx('USD/PLN', 3.64, 0.8, 1.2),
  fx('USD/HUF', 336.5, 0.8, 1.3),
  fx('USD/CZK', 20.8, 0.8, 1.1),
  fx('USD/THB', 32.4, 0.8),
  fx('EUR/SEK', 11.02, 0.8, 1.1),
  fx('EUR/NOK', 11.72, 0.8, 1.1),
  fx('EUR/DKK', 7.463, 0.78, 0.3),
  fx('EUR/PLN', 4.26, 0.8),
  fx('EUR/HUF', 394, 0.8, 1.2),
  fx('EUR/CZK', 24.35, 0.8),
  fx('EUR/TRY', 48.6, 0.8, 1.4),
  fx('USD/TRY', 41.5, 0.8, 1.4),
  fx('USD/ZAR', 17.45, 0.8, 1.5),
  fx('USD/MXN', 18.45, 0.8, 1.4),
  // --- Forex: OTC-only exotics -------------------------------------------------------
  fxOtc('USD/PKR', 281.5),
  fxOtc('USD/INR', 88.6),
  fxOtc('USD/BDT', 122.2),
  fxOtc('USD/BRL', 5.38),
  fxOtc('USD/IDR', 16450),
  fxOtc('USD/PHP', 57.4),
  fxOtc('USD/EGP', 48.3),
  fxOtc('USD/NGN', 1510),
  fxOtc('USD/COP', 3920),
  fxOtc('USD/ARS', 1420),
  fxOtc('USD/DZD', 130.2),
  fxOtc('USD/VND', 26350),
  fxOtc('USD/KES', 129.2),
  fxOtc('USD/LKR', 302),
  fxOtc('USD/MYR', 4.22),
  fxOtc('USD/CLP', 958),
  fxOtc('EUR/RUB', 96.5),
  fxOtc('USD/RUB', 82.5),
  fxOtc('AED/CNY', 1.938),
  fxOtc('QAR/CNY', 1.955),
  fxOtc('SAR/CNY', 1.898),
  fxOtc('OMR/CNY', 18.49),
  fxOtc('BHD/CNY', 18.89),
  fxOtc('JOD/CNY', 10.04),
  fxOtc('KES/USD', 0.00774),
  fxOtc('TND/USD', 0.3435),
  fxOtc('MAD/USD', 0.1103),
  fxOtc('ZAR/USD', 0.0573),
  fxOtc('UAH/USD', 0.0241),
  fxOtc('YER/USD', 0.00399),
  fxOtc('LBP/USD', 0.0000112),
  fxOtc('NGN/USD', 0.000662),
  fxOtc('CHF/NOK', 12.52),

  // --- Crypto ---------------------------------------------------------------------
  crypto('BTC/USD', 'Bitcoin', 112000, 2, 0.85),
  crypto('ETH/USD', 'Ethereum', 4100, 2, 0.85),
  crypto('SOL/USD', 'Solana', 205, 2, 0.83, 5),
  crypto('XRP/USD', 'Ripple', 2.85, 4, 0.83, 5),
  crypto('BNB/USD', 'BNB', 920, 2, 0.83),
  crypto('ADA/USD', 'Cardano', 0.81, 4, 0.82, 5),
  crypto('DOGE/USD', 'Dogecoin', 0.235, 5, 0.82, 5.5),
  crypto('LTC/USD', 'Litecoin', 108, 2, 0.83, 4.5),
  crypto('BCH/USD', 'Bitcoin Cash', 560, 2, 0.82, 4.5),
  crypto('DOT/USD', 'Polkadot', 4.1, 4, 0.82, 5),
  crypto('LINK/USD', 'Chainlink', 21.5, 3, 0.82, 5),
  crypto('AVAX/USD', 'Avalanche', 29.5, 3, 0.82, 5),
  crypto('TRX/USD', 'TRON', 0.335, 5, 0.8, 3.5),
  crypto('TON/USD', 'Toncoin', 2.95, 4, 0.82, 5),
  crypto('SHIB/USD', 'Shiba Inu', 0.0000128, 9, 0.8, 6),
  crypto('PEPE/USD', 'Pepe', 0.0000101, 9, 0.8, 6.5),
  crypto('DASH/USD', 'Dash', 24.5, 3, 0.8, 5),
  crypto('XLM/USD', 'Stellar', 0.37, 5, 0.8, 5),
  crypto('ATOM/USD', 'Cosmos', 4.5, 4, 0.8, 5),
  crypto('NEAR/USD', 'NEAR', 2.95, 4, 0.8, 5),

  // --- Commodities ------------------------------------------------------------------
  commodity('XAU/USD', 'Gold', '🥇', 3950, 2, 0.86, 1.8),
  commodity('XAG/USD', 'Silver', '🥈', 47.5, 3, 0.85, 2.5),
  commodity('XPT/USD', 'Platinum', '⚪', 1560, 2, 0.83, 2.4),
  commodity('XPD/USD', 'Palladium', '⚫', 1270, 2, 0.82, 2.8),
  commodity('UKOIL', 'Brent Oil', '🛢️', 67.5, 2, 0.84, 2.5),
  commodity('USOIL', 'WTI Crude Oil', '🛢️', 63.8, 2, 0.84, 2.6),
  commodity('XNG/USD', 'Natural Gas', '🔥', 3.25, 3, 0.82, 3.2),
  commodity('XCU/USD', 'Copper', '🟤', 4.85, 4, 0.82, 2),

  // --- Stocks (US) ------------------------------------------------------------------
  stock('AAPL', 'Apple', 252),
  stock('MSFT', 'Microsoft', 515),
  stock('AMZN', 'Amazon', 222, 0.82, 2.6),
  stock('GOOGL', 'Alphabet (Google)', 245, 0.82, 2.4),
  stock('META', 'Meta (Facebook)', 715, 0.82, 2.8),
  stock('TSLA', 'Tesla', 435, 0.82, 3.6),
  stock('NVDA', 'NVIDIA', 186, 0.82, 3.2),
  stock('NFLX', 'Netflix', 1210, 0.8, 2.8),
  stock('AMD', 'AMD', 165, 0.8, 3.4),
  stock('INTC', 'Intel', 36.5, 0.8, 3),
  stock('BABA', 'Alibaba', 178, 0.8, 3.2),
  stock('BA', 'Boeing', 218, 0.8, 2.6),
  stock('MCD', "McDonald's", 302, 0.8, 1.6),
  stock('KO', 'Coca-Cola', 68.2, 0.8, 1.3),
  stock('PFE', 'Pfizer', 24.8, 0.8, 2),
  stock('JNJ', 'Johnson & Johnson', 177, 0.8, 1.4),
  stock('V', 'Visa', 345, 0.8, 1.6),
  stock('MA', 'Mastercard', 575, 0.8, 1.6),
  stock('JPM', 'JPMorgan Chase', 305, 0.8, 1.8),
  stock('BAC', 'Bank of America', 50.5, 0.8, 2),
  stock('GS', 'Goldman Sachs', 785, 0.8, 2),
  stock('AXP', 'American Express', 335, 0.8, 1.8),
  stock('DIS', 'Disney', 114, 0.8, 2),
  stock('PYPL', 'PayPal', 69.5, 0.8, 2.6),
  stock('CSCO', 'Cisco', 68.4, 0.8, 1.6),
  stock('IBM', 'IBM', 282, 0.8, 1.8),
  stock('ORCL', 'Oracle', 292, 0.8, 3),
  stock('XOM', 'ExxonMobil', 114, 0.8, 1.8),
  stock('NKE', 'Nike', 70.5, 0.8, 2.2),
  stock('SBUX', 'Starbucks', 84.5, 0.8, 2),
  stock('WMT', 'Walmart', 101, 0.8, 1.4),
  stock('UBER', 'Uber', 97, 0.8, 2.8),
  stock('COIN', 'Coinbase', 345, 0.8, 4),
  stock('PLTR', 'Palantir', 182, 0.8, 4),

  // --- Indices ----------------------------------------------------------------------
  index('US30', 'Dow Jones 30', '🇺🇸', 'futures', 46300),
  index('US500', 'S&P 500', '🇺🇸', 'futures', 6680),
  index('USTEC', 'Nasdaq 100', '🇺🇸', 'futures', 24700, 0.83, 1.9),
  index('UK100', 'FTSE 100', '🇬🇧', 'uk', 9420),
  index('DE40', 'DAX 40', '🇩🇪', 'eu', 24250),
  index('FR40', 'CAC 40', '🇫🇷', 'eu', 7950),
  index('EU50', 'Euro Stoxx 50', '🇪🇺', 'eu', 5560),
  index('ES35', 'IBEX 35', '🇪🇸', 'eu', 15200),
  index('JP225', 'Nikkei 225', '🇯🇵', 'jp', 45200, 0.83, 1.8),
  index('AUS200', 'ASX 200', '🇦🇺', 'au', 8850),
  index('HK50', 'Hang Seng', '🇭🇰', 'hk', 26600, 0.82, 1.9),
];

export const CATEGORIES: Array<'All' | Category> = ['All', 'Forex', 'Crypto', 'Commodities', 'Stocks', 'Indices'];

const BY_SYMBOL = new Map(ASSETS.map((a) => [a.symbol, a]));

export function getAsset(symbol: string): Asset {
  return BY_SYMBOL.get(symbol) ?? BY_SYMBOL.get('EUR/USD')!;
}

/** True when the pair runs on the OTC feed: its real market is closed (or it has none). */
export function isOtc(asset: Asset, now?: Date | number): boolean {
  return !isMarketOpen(asset.market, now instanceof Date ? now.getTime() : now);
}

/** "EUR/USD (OTC)" while the real market is closed. */
export function displayName(asset: Asset, now?: Date | number): string {
  return isOtc(asset, now) ? `${asset.symbol} (OTC)` : asset.symbol;
}

/** When this instrument trades on the real market, e.g. "Sun 17:00 – Fri 17:00 New York time". */
export function marketHours(asset: Asset): string {
  return MARKET_HOURS_TEXT[asset.market];
}
