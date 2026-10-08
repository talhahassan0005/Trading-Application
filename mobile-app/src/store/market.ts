import { create } from 'zustand';

/** Which pair the Trade screen is showing. */
interface MarketState {
  symbol: string;
  setSymbol: (symbol: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  symbol: 'EUR/USD',
  setSymbol: (symbol) => set({ symbol }),
}));
