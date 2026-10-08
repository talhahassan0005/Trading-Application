import { useEffect, useState } from 'react';
import { getSeries } from '../data/otcFeed';

/** Latest simulated price + % change for a symbol, updated every tick. */
export function useLivePrice(symbol: string): { price: number; change: number } {
  const [snap, setSnap] = useState(() => {
    const s = getSeries(symbol);
    return { price: s.price, change: s.change };
  });
  useEffect(() => {
    const s = getSeries(symbol);
    setSnap({ price: s.price, change: s.change });
    return s.subscribe(() => setSnap({ price: s.price, change: s.change }));
  }, [symbol]);
  return snap;
}
