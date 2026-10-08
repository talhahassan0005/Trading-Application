/** Demo leaderboard — entirely fictional names and amounts, not real traders. */
export interface LeaderboardEntry {
  rank: number;
  name: string;
  flag: string;
  amount: number;
}

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Demo Trader One', flag: '🏳️', amount: 30_000 },
  { rank: 2, name: 'Simulated Pro', flag: '🏳️', amount: 27_450 },
  { rank: 3, name: 'Paper Hands Wins', flag: '🏳️', amount: 21_980 },
  { rank: 4, name: 'Candle Watcher', flag: '🏳️', amount: 19_872 },
  { rank: 5, name: 'Trend Follower', flag: '🏳️', amount: 14_652 },
  { rank: 6, name: 'OTC Enjoyer', flag: '🏳️', amount: 14_580 },
  { rank: 7, name: 'Steady Hands', flag: '🏳️', amount: 11_031 },
  { rank: 8, name: 'Risk Taker 22', flag: '🏳️', amount: 8_018 },
  { rank: 9, name: 'Green Candle Fan', flag: '🏳️', amount: 7_410 },
  { rank: 10, name: 'Wick Hunter', flag: '🏳️', amount: 7_350 },
  { rank: 11, name: 'Late Night Trader', flag: '🏳️', amount: 7_116 },
  { rank: 12, name: 'Momentum Player', flag: '🏳️', amount: 6_959 },
  { rank: 13, name: 'Range Bound', flag: '🏳️', amount: 5_303 },
  { rank: 14, name: 'Breakout Betty', flag: '🏳️', amount: 5_025 },
  { rank: 15, name: 'Demo Account 88', flag: '🏳️', amount: 4_660 },
];
