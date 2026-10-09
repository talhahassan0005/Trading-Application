/**
 * OTC price feed engine.
 *
 * Every instrument is driven by an Ornstein-Uhlenbeck (mean-reverting) random
 * walk on a normalised price x (x = 1 means "at basePrice"):
 *
 *     dx = theta * (mu - x) * dt + sigma * sqrt(dt) * gauss()
 *
 * `mu`, the level x reverts to, moves in trend "legs" with pullbacks (plus rare
 * spikes) so the price wanders like a real session but can never blow up. Ticks arrive every `dt` = 0.25 s and are aggregated into OHLC
 * candles by `getCandles`.
 *
 * Performance: only series somebody is watching tick live. Any other series is
 * caught up in one go (coarse exact-OU steps) the next time it's read, so idle
 * pairs cost nothing. A new series starts with a short history; the full day is
 * generated only when a chart first asks for candles.
 *
 * This module is framework-free (no React) so the trades store can read prices
 * from it directly; `useOtcFeed.ts` is the React binding.
 */
import { Asset, getAsset, isOtc } from './assets';

export interface Candle {
  time: number; // bucket start, ms epoch
  open: number;
  high: number;
  low: number;
  close: number;
}

export const THETA = 0.9; // reversion strength
export const SIGMA = 0.0011; // volatility (per sqrt-second, normalised)
export const DT = 0.25; // seconds per live tick
export const TICK_MS = DT * 1000;

// Visual scale on top of SIGMA so candles get real wicks (the chart auto-fits its y-axis).
const VOL_SCALE = 1.0;

// While a pair is in its real-market window (see Asset.realMarket), it moves like an actual
// live session — small, steady percentage changes — instead of the punchier OTC pattern.
// Pairs without that flag stay on the OTC pattern all the time, like most of a real OTC
// broker's pair list.
const REAL_MARKET_VOL_SCALE = 0.32;

// The reversion level mu moves in "legs" — the pattern an OTC feed shows: an impulse
// in one direction for a minute or two, then usually a pullback, sometimes a
// continuation. Each leg pulls mu toward a fresh target; targets stay within ±4 %
// of basePrice so the price can never run away.
const LEG_K = 0.05; // how fast mu chases the leg target (1/s)
const MU_SIGMA = 0.00015; // small noise on mu itself
const MU_CLAMP = 0.04;
const LEG_MIN_S = 40;
const LEG_MAX_S = 200;
const LEG_SIZE_MIN = 0.0012; // leg amplitude, normalised (0.12 % ...
const LEG_SIZE_MAX = 0.005; // ... 0.5 %)
const PULLBACK_P = 0.6; // chance a leg reverses the previous one

// Occasional quick spikes (about one per 2.5 min); the fast reversion turns them into wicks.
const SPIKE_PER_S = 1 / 150;
const SPIKE_MIN = 2; // in units of sigma
const SPIKE_MAX = 3.5;

// Volatility regime: log-volatility is a slow OU process, so the feed has quiet
// stretches and busy stretches (wide candles, long wicks) like a real session.
const LV_THETA = 0.003;
const LV_SIGMA = 0.02;
const LV_CLAMP = 0.7;

// History is generated at a coarser step (exact OU transition) so seeding is cheap.
const SEED_HOURS = 24; // a full day of history to scroll through (built on first chart use)
const QUICK_SEED_MS = 15 * 60_000; // enough for a price + the 5-minute change ticker
const SEED_STEP_S = 2;
const MAX_POINTS = 250_000; // trim cap for the tick history
const TRIM_TO = 200_000;
const CHANGE_WINDOW_MS = 5 * 60_000; // window for the live % change ticker

/** Standard normal via Box-Muller. */
export function gauss(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Listener = () => void;

export class OtcSeries {
  readonly asset: Asset;
  times: number[] = [];
  prices: number[] = [];
  /** Price at the start of the seeded history — fallback reference for the % change. */
  openPrice: number;
  /** True once the full SEED_HOURS of history exists (see ensureHistory). */
  private fullHistory = false;
  private regimeMinute = -1;
  private regimeValue = 1;
  /** Points trimmed from the front so far; keeps candle-cache indexes valid. */
  dropped = 0;
  private x = 1;
  private mu = 1;
  private lv = 0; // log volatility regime
  private legTarget = 1;
  private legEnd = 0; // ms timestamp when the current leg ends
  private legDir = 1;
  private listeners = new Set<Listener>();

  /** Seeds `spanMs` of history ending at `endMs`. */
  constructor(asset: Asset, spanMs = QUICK_SEED_MS, endMs = Date.now()) {
    this.asset = asset;
    this.seed(spanMs, endMs);
    this.openPrice = this.prices[0];
  }

  /** 1 normally (OTC pattern); scaled down while this pair's real market is open. Cached per minute. */
  private regime(t: number): number {
    const minute = Math.floor(t / 60_000);
    if (minute !== this.regimeMinute) {
      this.regimeMinute = minute;
      this.regimeValue = isOtc(this.asset, t) ? 1 : REAL_MARKET_VOL_SCALE;
    }
    return this.regimeValue;
  }

  /** Starts a new leg: usually a pullback against the last one, sometimes a continuation. */
  private newLeg(nowMs: number): void {
    this.legEnd = nowMs + (LEG_MIN_S + Math.random() * (LEG_MAX_S - LEG_MIN_S)) * 1000;
    this.legDir = Math.random() < PULLBACK_P ? -this.legDir : this.legDir;
    const size =
      (LEG_SIZE_MIN + Math.random() * (LEG_SIZE_MAX - LEG_SIZE_MIN)) * this.asset.volatility * Math.exp(this.lv) * this.regime(nowMs);
    this.legTarget = clamp(1 + 0.6 * (this.mu - 1) + this.legDir * size, 1 - MU_CLAMP, 1 + MU_CLAMP);
  }

  /** Moves mu toward the leg target over `dt` seconds (exact OU step, valid for any dt). */
  private stepMu(dt: number, nowMs: number): void {
    if (nowMs >= this.legEnd) this.newLeg(nowMs);
    const decay = Math.exp(-LEG_K * dt);
    const sd = MU_SIGMA * Math.sqrt((1 - decay * decay) / (2 * LEG_K));
    this.mu = clamp(this.legTarget + (this.mu - this.legTarget) * decay + sd * gauss(), 1 - MU_CLAMP, 1 + MU_CLAMP);
  }

  /** Random spike added to x, in units of the per-step sigma. Rarer while a real market is open. */
  private spike(dt: number, sigma: number, t: number): number {
    if (Math.random() >= SPIKE_PER_S * dt * this.regime(t)) return 0;
    return (Math.random() < 0.5 ? -1 : 1) * (SPIKE_MIN + Math.random() * (SPIKE_MAX - SPIKE_MIN)) * sigma;
  }

  /** One exact-OU step of `dt` seconds ending at time `t` (seeding and gap backfill). */
  private stepExact(dt: number, t: number): void {
    const decay = Math.exp(-THETA * dt);
    const lvDecay = Math.exp(-LV_THETA * dt);
    const lvSd = LV_SIGMA * Math.sqrt((1 - lvDecay * lvDecay) / (2 * LV_THETA));
    this.lv = clamp(this.lv * lvDecay + lvSd * gauss(), -LV_CLAMP, LV_CLAMP);
    const sigma = SIGMA * VOL_SCALE * this.asset.volatility * Math.exp(this.lv) * this.regime(t);
    const sd = sigma * Math.sqrt((1 - decay * decay) / (2 * THETA));
    this.stepMu(dt, t);
    this.x = this.mu + (this.x - this.mu) * decay + sd * gauss() + this.spike(dt, sigma, t);
    this.times.push(t);
    this.prices.push(this.x * this.asset.basePrice);
  }

  /** Generates history at a coarse step (cheap start-up). */
  private seed(spanMs: number, endMs: number): void {
    const n = Math.max(1, Math.floor(spanMs / (SEED_STEP_S * 1000)));
    for (let i = 0; i < n; i++) this.stepExact(SEED_STEP_S, endMs - (n - 1 - i) * SEED_STEP_S * 1000);
  }

  /**
   * Fills any gap up to now with coarse steps — after the app was paused, or while nobody
   * was watching this series (idle series don't tick). Cheap no-op when already current.
   */
  catchUp(nowMs = Date.now()): void {
    const lastT = this.times[this.times.length - 1];
    if (nowMs - lastT <= 3000) return;
    for (let t = Math.max(lastT, nowMs - SEED_HOURS * 3600_000) + SEED_STEP_S * 1000; t < nowMs - TICK_MS; t += SEED_STEP_S * 1000) {
      this.stepExact(SEED_STEP_S, t);
    }
  }

  /**
   * Extends a quick-seeded series back to a full day before its first candles are built.
   * The older stretch is generated independently and then bent (a straight-line correction
   * spread over the whole day, invisible on a chart) so it ends exactly where the existing
   * history begins.
   */
  ensureHistory(): void {
    if (this.fullHistory) return;
    this.fullHistory = true;
    const firstT = this.times[0];
    const missing = SEED_HOURS * 3600_000 - (this.times[this.times.length - 1] - firstT);
    if (missing <= SEED_STEP_S * 1000) return;
    const older = new OtcSeries(this.asset, missing, firstT - SEED_STEP_S * 1000);
    const n = older.prices.length;
    const gap = this.prices[0] - older.price;
    for (let i = 0; i < n; i++) older.prices[i] += (gap * (i + 1)) / n;
    this.times = older.times.concat(this.times);
    this.prices = older.prices.concat(this.prices);
    this.openPrice = this.prices[0];
  }

  /** One live tick using the literal OU update from the spec. */
  tick(): void {
    const nowMs = Date.now();
    this.catchUp(nowMs);
    this.lv = clamp(this.lv - LV_THETA * this.lv * DT + LV_SIGMA * Math.sqrt(DT) * gauss(), -LV_CLAMP, LV_CLAMP);
    const sigma = SIGMA * VOL_SCALE * this.asset.volatility * Math.exp(this.lv) * this.regime(nowMs);
    this.stepMu(DT, nowMs);
    this.x += THETA * (this.mu - this.x) * DT + sigma * Math.sqrt(DT) * gauss() + this.spike(DT, sigma, nowMs);
    this.times.push(nowMs);
    this.prices.push(this.x * this.asset.basePrice);
    if (this.prices.length > MAX_POINTS) {
      this.dropped += this.prices.length - TRIM_TO;
      this.times = this.times.slice(-TRIM_TO);
      this.prices = this.prices.slice(-TRIM_TO);
    }
    this.listeners.forEach((l) => l());
  }

  get price(): number {
    return this.prices[this.prices.length - 1];
  }

  /**
   * % change over the last CHANGE_WINDOW_MS — a live "recent move" ticker, not the change
   * since the day's start. This is what actually makes the OTC/real-market difference
   * visible at a glance: over a short window a low-volatility real-market pair reads
   * clearly smaller than a punchier OTC pair, whereas the day's total drift can land
   * anywhere for either one by chance.
   */
  get change(): number {
    const cutoff = Date.now() - CHANGE_WINDOW_MS;
    let lo = 0;
    let hi = this.times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.times[mid] < cutoff) lo = mid + 1;
      else hi = mid;
    }
    const refPrice = this.prices[Math.min(lo, this.prices.length - 1)] ?? this.openPrice;
    return ((this.price - refPrice) / refPrice) * 100;
  }

  get watched(): boolean {
    return this.listeners.size > 0;
  }

  subscribe(listener: Listener): () => void {
    this.catchUp();
    this.listeners.add(listener);
    ensureTicker();
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// --- registry + shared ticker -------------------------------------------------

const registry = new Map<string, OtcSeries>();
let timer: ReturnType<typeof setInterval> | null = null;

/** Ticks only the series that are on screen; stops itself when nothing is watched. */
function ensureTicker(): void {
  if (timer) return;
  timer = setInterval(() => {
    let any = false;
    registry.forEach((s) => {
      if (!s.watched) return;
      any = true;
      s.tick();
    });
    if (!any && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, TICK_MS);
}

/** Lazily creates the series for a symbol and brings it up to date. */
export function getSeries(symbol: string): OtcSeries {
  let series = registry.get(symbol);
  if (!series) {
    series = new OtcSeries(getAsset(symbol));
    registry.set(symbol, series);
  } else {
    series.catchUp();
  }
  return series;
}

/** Current price for a symbol — used by the trading engine to lock entry/exit. */
export function getPrice(symbol: string): number {
  return getSeries(symbol).price;
}

// --- candle aggregation -------------------------------------------------------

/** Folds one price point into a candle list (mutating the live candle in place). */
function addPoint(candles: Candle[], bucketMs: number, time: number, p: number): void {
  const bucket = Math.floor(time / bucketMs) * bucketMs;
  const last = candles[candles.length - 1];
  if (last && last.time === bucket) {
    last.high = Math.max(last.high, p);
    last.low = Math.min(last.low, p);
    last.close = p;
  } else {
    // Open on the previous close so candles are contiguous.
    const open = last ? last.close : p;
    candles.push({ time: bucket, open, high: Math.max(open, p), low: Math.min(open, p), close: p });
  }
}

interface CandleCache {
  candles: Candle[];
  next: number; // absolute index (incl. trimmed points) of the first unprocessed point
}
const cache = new Map<string, CandleCache>();

/**
 * All candles of `seconds` each for the series (the whole seeded day + live).
 * Built incrementally: only new ticks are folded in, so calling it every tick is
 * cheap. The last candle is the live one. Returns a fresh array each call (so React
 * sees a change); the candle objects themselves are shared.
 */
export function getCandles(series: OtcSeries, seconds: number): Candle[] {
  const key = `${series.asset.symbol}|${seconds}`;
  let c = cache.get(key);
  if (!c) {
    series.ensureHistory(); // must happen before any cache index is taken
    c = { candles: [], next: series.dropped };
    cache.set(key, c);
  }
  const bucketMs = seconds * 1000;
  let i = Math.max(0, c.next - series.dropped);
  for (; i < series.prices.length; i++) addPoint(c.candles, bucketMs, series.times[i], series.prices[i]);
  c.next = series.dropped + series.prices.length;
  return c.candles.slice();
}
