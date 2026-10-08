import {
  LayoutGrid,
  Banknote,
  Users,
  ShieldCheck,
  BookText,
  Flag,
  Settings,
  UserX,
  type LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  path: string;
  label: string;
  icon: LucideIcon;
}

/** Single source of truth for the sidebar nav order, labels, icons and routes. */
export const navItems: NavItemConfig[] = [
  { path: '/', label: 'Overview', icon: LayoutGrid },
  { path: '/withdrawals', label: 'Withdrawals', icon: Banknote },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/kyc', label: 'KYC review', icon: ShieldCheck },
  { path: '/deletion-requests', label: 'Deletion requests', icon: UserX },
  { path: '/ledger', label: 'Ledger', icon: BookText },
  { path: '/disputes', label: 'Disputes', icon: Flag },
  { path: '/settings', label: 'Settings', icon: Settings },
];
