import { useMemo } from 'react';
import { getPrice } from '../data/otcFeed';
import { useTradesStore, projectedPnl } from '../store/trades';
import { useNow } from './useNow';

/** Combined running P/L of all open positions, refreshed every second. */
export function useOpenPnl(): number {
  const positions = useTradesStore((s) => s.positions);
  const now = useNow(1000);
  return useMemo(
    () =>
      positions
        .filter((p) => p.status === 'open')
        .reduce((sum, p) => sum + projectedPnl(p, getPrice(p.symbol)), 0),
    // `now` is a deliberate trigger: prices move between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positions, now],
  );
}
