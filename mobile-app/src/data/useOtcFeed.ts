import { useEffect, useState } from 'react';
import { useMarketStore } from '../store/market';
import { Candle, getCandles, getSeries } from './otcFeed';

export interface OtcFeed {
  candles: Candle[]; // the whole day, oldest -> newest; the last one is live
  price: number;
  change: number; // % vs. start of the session window
}

/**
 * Live OTC candles for a pair (full day of history plus the live candle).
 * @param secondsPerCandle candle interval (60 / 300 / 900)
 * @param symbol defaults to the pair currently selected in the market store
 */
export function useOtcFeed(secondsPerCandle: number, symbol?: string): OtcFeed {
  const selected = useMarketStore((s) => s.symbol);
  const sym = symbol ?? selected;

  const build = (): OtcFeed => {
    const series = getSeries(sym);
    return {
      candles: getCandles(series, secondsPerCandle),
      price: series.price,
      change: series.change,
    };
  };

  const [feed, setFeed] = useState<OtcFeed>(build);

  useEffect(() => {
    setFeed(build());
    // Every tick the live candle is rebuilt from the tail of the tick history;
    // when the bucket rolls over the old candle is locked and a new one opens.
    return getSeries(sym).subscribe(() => setFeed(build()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sym, secondsPerCandle]);

  return feed;
}
