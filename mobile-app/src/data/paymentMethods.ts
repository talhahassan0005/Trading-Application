/**
 * Deposit/withdraw method catalogue. Bank and USDT get a bold letter-monogram tile — a
 * stand-in for a real logo where there's no licensed asset. JazzCash, Easypaisa and Binance
 * use real logo files (supplied directly, under the user's own merchant relationships with
 * each) — see `logo` below. See the "SANDBOX" tag next to the picker: this whole flow is a
 * mockup for where a real payment-gateway sandbox would plug in later.
 */
import type { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

export type MethodCategory = 'Popular' | 'E-wallet' | 'Bank' | 'Crypto';

export const METHOD_IDS = ['jazzcash', 'easypaisa', 'bank', 'binance', 'usdt', 'usdt_erc20'] as const;
export type PayMethod = (typeof METHOD_IDS)[number];

export interface PaymentMethod {
  id: PayMethod;
  label: string;
  minAmount: number;
  /** Fallback Ionicon (used only if a mono badge doesn't fit, e.g. very small sizes). */
  icon: keyof typeof Ionicons.glyphMap;
  /** 1–4 letter monogram shown on a solid tile — used when there's no real `logo`. */
  mono: string;
  color: string;
  categories: MethodCategory[];
  /** Real logo image, when a licensed asset is available — takes priority over the mono tile. */
  logo?: ImageSourcePropType;
  /** Fraction of the tile the logo image fills (0–1). Default 0.72; use ~0.92+ for logo files that already include their own padding/background. */
  logoFill?: number;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'jazzcash',
    label: 'JazzCash',
    minAmount: 10,
    icon: 'phone-portrait-outline',
    mono: 'JC',
    color: '#FFFFFF',
    categories: ['Popular', 'E-wallet'],
    logo: require('../../assets/payment-methods/jazzcash.png'),
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    minAmount: 10,
    icon: 'wallet-outline',
    mono: 'EP',
    color: '#2D2A3D', // matches the logo's own background so the tile edge doesn't show a seam
    categories: ['Popular', 'E-wallet'],
    logo: require('../../assets/payment-methods/easypaisa.png'),
    logoFill: 0.94, // the file is already a padded square icon
  },
  { id: 'bank', label: 'Bank transfer', minAmount: 20, icon: 'business-outline', mono: 'BANK', color: '#4B5563', categories: ['Bank'] },
  {
    id: 'binance',
    label: 'Binance Pay',
    minAmount: 10,
    icon: 'logo-bitcoin',
    mono: 'BP',
    color: '#1E2026', // dark tile so the gold mark (transparent PNG) has contrast
    categories: ['Popular', 'Crypto'],
    logo: require('../../assets/payment-methods/binance.png'),
  },
  { id: 'usdt', label: 'USDT (TRC-20)', minAmount: 20, icon: 'swap-horizontal-outline', mono: '₮', color: '#1C9C7B', categories: ['Crypto'] },
  { id: 'usdt_erc20', label: 'USDT (ERC-20)', minAmount: 20, icon: 'swap-horizontal-outline', mono: '₮', color: '#627EEA', categories: ['Crypto'] },
];

export const METHOD_CATEGORIES: MethodCategory[] = ['Popular', 'E-wallet', 'Bank', 'Crypto'];

export function methodFor(id: PayMethod): PaymentMethod {
  return PAYMENT_METHODS.find((m) => m.id === id) ?? PAYMENT_METHODS[0];
}
