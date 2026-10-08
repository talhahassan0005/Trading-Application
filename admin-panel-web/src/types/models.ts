export interface AdminUser {
  name: string;
  email: string;
  role: string;
}

export interface OverviewStats {
  pendingWithdrawals: number;
  pendingWithdrawalsHeld: number;
  depositsToday: number;
  depositsChangePct: number;
  activeUsers24h: number;
  openDisputes: number;
}

export type ActivityType = 'withdrawal' | 'deposit' | 'kyc' | 'trade' | 'dispute';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timeAgo: string;
}

export interface NotificationItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timeAgo: string;
  read: boolean;
}

export type KycStatus = 'unverified' | 'verified' | 'pending' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'E-wallet' | 'Crypto' | 'Card' | 'Bank transfer';
  kycStatus: KycStatus;
  requestedAgo: string;
}

export type AccountStatus = 'active' | 'frozen';

/** Tenure-based grouping so staff can filter the user list — new signups first. */
export type UserSegment = 'new' | 'existing' | 'veteran';

/**
 * Sandbox-only setting for the demo/paper-trading mode: biases the
 * simulator's random outcome generator for this user's practice trades.
 * Never applies to real-money trades, which are always priced from live
 * market data.
 */
export type DemoTradeOutcome = 'profit' | 'moderate' | 'loss';

export interface PlatformUser {
  id: string;
  /** Short public account number, the same one the user sees in the app. */
  accountNo: number;
  name: string;
  email: string;
  balance: number;
  kycStatus: KycStatus;
  status: AccountStatus;
  joinedAt: string;
  demoTradeOutcome: DemoTradeOutcome;
}

export type CheckResult = 'pass' | 'fail' | 'manual';

export type KycDocumentType =
  | 'passport'
  | 'id_front'
  | 'id_back'
  | 'selfie'
  | 'driver_license'
  | 'national_id'
  | 'proof_of_address';

export interface KycDocument {
  id: string;
  type: KycDocumentType;
  label: string;
  uploadedAt: string;
  /** Path of the file in the private storage bucket. */
  storagePath?: string;
}

export interface KycCase {
  id: string;
  userId: string;
  accountNo?: number;
  userName: string;
  documentType: string;
  waitingFor: string;
  /** What the user typed in the app, to compare against the documents. */
  applicant: KycApplicant;
  documents: KycDocument[];
}

export interface KycApplicant {
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  country: string | null;
  address: string;
}

export type LedgerEntryType =
  | 'deposit'
  | 'trade_stake'
  | 'trade_payout'
  | 'withdraw_hold'
  | 'withdraw_release';

export interface LedgerRow {
  account: string;
  amount: number;
  balance: number | null;
}

export interface LedgerTransaction {
  txId: string;
  type: LedgerEntryType;
  rows: LedgerRow[];
}

export type DisputeStatus = 'open' | 'review' | 'resolved';

export interface DisputeCase {
  id: string;
  title: string;
  amount?: number;
  userId: string;
  description: string;
  status: DisputeStatus;
}

export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DeletionRequest {
  id: string;
  /** Null once the account has been deleted. */
  userId: string | null;
  accountNo: number | null;
  userName: string;
  email: string;
  reason: string;
  status: DeletionRequestStatus;
  createdAt: string;
  decidedAt: string | null;
}
