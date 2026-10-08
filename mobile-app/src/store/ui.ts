/** Small session-level UI flags. */
import { create } from 'zustand';

interface UiState {
  /** The deposit-bonus banner was dismissed this session. */
  bonusDismissed: boolean;
  dismissBonus: () => void;
  /** Called on sign-in / sign-out so the banner shows again on the next login. */
  resetBonus: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  bonusDismissed: false,
  dismissBonus: () => set({ bonusDismissed: true }),
  resetBonus: () => set({ bonusDismissed: false }),
}));
