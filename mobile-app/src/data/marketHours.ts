/**
 * Real-market trading hours, evaluated in each exchange's own local time with
 * daylight-saving rules applied (no Intl / time-zone database needed).
 *
 * While a pair's market is open it trades on the "real market" pattern; once it
 * closes the same pair switches to "(OTC)" — the way Binomo / Quotex style
 * brokers show it. Exchange holidays are only modelled for US stocks.
 */

export type Market =
  | 'fx' // Forex: Sun 17:00 -> Fri 17:00 New York time
  | 'futures' // Metals, energies, US index CFDs: Sun 18:00 -> Fri 17:00 NY, daily break 17:00-18:00 NY
  | 'us-stocks' // NYSE / Nasdaq: Mon-Fri 09:30-16:00 NY
  | 'uk' // London: Mon-Fri 08:00-16:30
  | 'eu' // Frankfurt / Paris / Madrid / Euro Stoxx: Mon-Fri 09:00-17:30 CET
  | 'jp' // Tokyo: Mon-Fri 09:00-11:30, 12:30-15:30
  | 'au' // Sydney: Mon-Fri 10:00-16:00
  | 'hk' // Hong Kong: Mon-Fri 09:30-12:00, 13:00-16:00
  | 'crypto' // never closes
  | 'otc'; // OTC-only instrument: no real market at all

type Zone = 'NY' | 'LON' | 'CET' | 'TYO' | 'HKG' | 'SYD';

const HOUR = 3_600_000;

/** UTC midnight (ms) of the n-th Sunday of a month (n = -1 for the last one). */
function sunday(year: number, month: number, n: number): number {
  if (n > 0) {
    const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    return Date.UTC(year, month, 1 + ((7 - firstDow) % 7) + (n - 1) * 7);
  }
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return Date.UTC(year, month, lastDay.getUTCDate() - lastDay.getUTCDay());
}

/** Minutes east of UTC for a zone at instant `t`. */
function offsetMin(zone: Zone, t: number): number {
  const y = new Date(t).getUTCFullYear();
  switch (zone) {
    case 'NY': {
      // EDT from the 2nd Sunday of March 02:00 EST to the 1st Sunday of November 02:00 EDT.
      const dst = t >= sunday(y, 2, 2) + 7 * HOUR && t < sunday(y, 10, 1) + 6 * HOUR;
      return dst ? -240 : -300;
    }
    case 'LON':
    case 'CET': {
      // EU summer time: last Sunday of March 01:00 UTC to last Sunday of October 01:00 UTC.
      const dst = t >= sunday(y, 2, -1) + HOUR && t < sunday(y, 9, -1) + HOUR;
      return (zone === 'LON' ? 0 : 60) + (dst ? 60 : 0);
    }
    case 'SYD': {
      // AEDT from the 1st Sunday of October 02:00 AEST to the 1st Sunday of April 03:00 AEDT
      // (both 16:00 UTC the day before).
      const dst = t < sunday(y, 3, 1) - 8 * HOUR || t >= sunday(y, 9, 1) - 8 * HOUR;
      return dst ? 660 : 600;
    }
    case 'TYO':
      return 540;
    case 'HKG':
      return 480;
  }
}

/** Day of week (0 = Sunday), minutes since midnight and YYYY-MM-DD in the zone's local time. */
function local(zone: Zone, t: number) {
  const d = new Date(t + offsetMin(zone, t) * 60_000);
  return {
    day: d.getUTCDay(),
    min: d.getUTCHours() * 60 + d.getUTCMinutes(),
    ymd: d.toISOString().slice(0, 10),
  };
}

const hm = (h: number, m = 0) => h * 60 + m;
const weekday = (day: number) => day >= 1 && day <= 5;

/** NYSE full-day closures (observed dates). */
const US_HOLIDAYS = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19',
  '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18',
  '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24',
]);

/** Weekly NY window shared by forex and futures-style markets. */
function nyWeek(t: number, sundayOpen: number, dailyBreak: boolean): boolean {
  const { day, min } = local('NY', t);
  if (day === 6) return false;
  if (day === 0) return min >= sundayOpen;
  if (day === 5 && min >= hm(17)) return false;
  if (dailyBreak && min >= hm(17) && min < hm(18)) return false;
  return true;
}

function session(zone: Zone, t: number, ...ranges: Array<[number, number]>): boolean {
  const { day, min } = local(zone, t);
  return weekday(day) && ranges.some(([a, b]) => min >= a && min < b);
}

export function isMarketOpen(market: Market, t: number = Date.now()): boolean {
  switch (market) {
    case 'crypto':
      return true;
    case 'otc':
      return false;
    case 'fx':
      return nyWeek(t, hm(17), false);
    case 'futures':
      return nyWeek(t, hm(18), true);
    case 'us-stocks':
      return session('NY', t, [hm(9, 30), hm(16)]) && !US_HOLIDAYS.has(local('NY', t).ymd);
    case 'uk':
      return session('LON', t, [hm(8), hm(16, 30)]);
    case 'eu':
      return session('CET', t, [hm(9), hm(17, 30)]);
    case 'jp':
      return session('TYO', t, [hm(9), hm(11, 30)], [hm(12, 30), hm(15, 30)]);
    case 'au':
      return session('SYD', t, [hm(10), hm(16)]);
    case 'hk':
      return session('HKG', t, [hm(9, 30), hm(12)], [hm(13), hm(16)]);
  }
}

/** Human-readable hours for the asset list footer / info. */
export const MARKET_HOURS_TEXT: Record<Market, string> = {
  fx: 'Sun 17:00 – Fri 17:00 New York time',
  futures: 'Sun 18:00 – Fri 17:00 New York time, daily break 17:00–18:00',
  'us-stocks': 'Mon–Fri 09:30–16:00 New York time',
  uk: 'Mon–Fri 08:00–16:30 London time',
  eu: 'Mon–Fri 09:00–17:30 Central European time',
  jp: 'Mon–Fri 09:00–15:30 Tokyo time',
  au: 'Mon–Fri 10:00–16:00 Sydney time',
  hk: 'Mon–Fri 09:30–16:00 Hong Kong time',
  crypto: 'Open 24/7',
  otc: 'OTC only',
};
