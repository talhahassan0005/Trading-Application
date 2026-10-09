import { useEffect, useState } from 'react';
import { getSeries } from '../data/otcFeed';

/**
 * Latest simulated price + % change for a symbol.
 * @param minIntervalMs re-render at most this often (lists use 1000 to stay light; default: every tick)
 */
export function useLivePrice(symbol: string, minIntervalMs = 0): { price: number; change: number } {
  const [snap, setSnap] = useState(() => {
    const s = getSeries(symbol);
    return { price: s.price, change: s.change };
  });
  useEffect(() => {
    const s = getSeries(symbol);
    setSnap({ price: s.price, change: s.change });
    let last = 0;
    return s.subscribe(() => {
      const now = Date.now();
      if (now - last < minIntervalMs) return;
      last = now;
      setSnap({ price: s.price, change: s.change });
    });
  }, [symbol, minIntervalMs]);
  return snap;
}
