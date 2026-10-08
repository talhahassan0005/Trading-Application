# Trynex

Cross-platform (iOS + Android) **binary-options trading simulator** built with Expo + React Native + TypeScript.

> **Portfolio / demo project.** Everything is simulated: prices, balances, deposits, withdrawals and KYC.
> No real money, no payment processing, no backend. A "DEMO · SIMULATED" badge is always visible.
> Trader-facing app only — there is no admin/back-office.

## Setup

```bash
npm install
npx expo start          # scan the QR code with Expo Go (iOS/Android)
# or: npm run ios / npm run android
```

Requires Node 20+. Sign in with any well-formed email and a password of 6+ characters
(sign-up OTP: any 6 digits).

## Architecture

```
src/
  theme/       dark + light palettes, spacing, typography; useTheme() and useStyles()
  navigation/  RootNavigator: auth stack (signed out) vs. tabs + asset-selector modal (signed in)
  components/  Button, Card, Segmented, PriceTag, CandleChart (react-native-svg), Timeline, ...
  screens/     one folder per screen
  data/        asset list + market hours, OTC feed engine (otcFeed.ts), useOtcFeed hook
  store/       zustand: auth, wallet, trades, market (selected pair), kyc
  hooks/       useNow, useLivePrice, useOpenPnl
```

### Theming
Tokens: `page, surface, card, border, text, muted, accent, up, down, warn` (plus `onAccent` for text on
filled buttons). Components read colors from `useTheme()` / `useStyles()`; nothing is hardcoded.
Dark is the default; switch at runtime from the Trade header or the Wallet screen.

### OTC candlestick feed (`src/data/otcFeed.ts`)
Each pair is an Ornstein-Uhlenbeck mean-reverting walk on a normalised price `x`:

```
dx = theta * (mu - x) * dt + sigma * sqrt(dt) * gauss()      theta 0.9, sigma 0.0011, dt 0.25 s
```

`mu` itself follows a much slower, clamped (±2 %) OU process, so the price wanders like a session but never
blows up. A shared ticker advances every series each 0.25 s; ticks are aggregated into OHLC candles by
`aggregateCandles` — the rightmost candle is live and locks when its time bucket rolls over.
History (10 h) is seeded with the exact OU transition at a coarser step so start-up is cheap.
Per-pair `volatility` scales sigma. Consume it with:

```ts
const { candles, price, change } = useOtcFeed(secondsPerCandle, symbol?)
```

A pair is labelled "(OTC)" when its real market is closed (approximate hours in `data/assets.ts`);
the feed is self-generated in that case, and the UI says so. (Open-market pairs also run on the simulated
feed — nothing here uses real market data.)

### Trading engine and money
- `store/trades.ts` — `placeTrade` locks the entry price from the feed, debits the stake and schedules
  settlement. At expiry: win pays `stake * (1 + payout)` (1.85× at the default 85 %), loss forfeits the
  stake, an exact tie refunds it.
- `store/wallet.ts` — the **only** place balances change. Deposits start `pending` and are credited only when
  confirmed; withdrawals hold funds immediately, then walk requested → under review → paid on timers.
  A real backend/ledger can replace these actions without touching the screens.

### Chart timeframe vs. trade expiry
Independent controls on the Trade screen: *chart timeframe* (1m/5m/15m) is the candle interval;
*trade expiry* (1:00/5:00/15:00) is how long a position runs.

## Demo shortcuts
- Deposit shows a "Simulate confirm" button, standing in for the payment provider's confirmation.
- KYC submissions auto-verify after a few seconds; the ID upload is a placeholder (nothing is uploaded).
- The "Real" wallet is also simulated and starts at $0.
