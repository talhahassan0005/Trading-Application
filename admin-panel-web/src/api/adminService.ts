import {
  mockActivity,
  mockDisputes,
  mockLedger,
  mockNotifications,
  mockOverviewStats,
  mockWithdrawals,
} from './mockData';
import { supabase } from './supabase';
import type {
  ActivityItem,
  DeletionRequest,
  DisputeCase,
  KycCase,
  KycDocument,
  LedgerTransaction,
  NotificationItem,
  OverviewStats,
  PlatformUser,
  WithdrawalRequest,
} from '../types/models';

/**
 * Back-office API. Every page calls through here, never the backend directly.
 *
 * Users, KYC and account-deletion requests are live (Supabase, shared with the
 * mobile app). Withdrawals, ledger, disputes, overview stats and notifications
 * are still mock data until the app's wallet is connected to a real backend.
 * Moving to a custom Node.js API later only means rewriting the bodies here.
 */
const DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

let withdrawals = [...mockWithdrawals];
let disputes = [...mockDisputes];
let notifications = [...mockNotifications];

export async function fetchOverviewStats(): Promise<OverviewStats> {
  return delay(mockOverviewStats);
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  return delay(mockActivity);
}

export async function fetchWithdrawals(): Promise<WithdrawalRequest[]> {
  return delay(withdrawals);
}

export async function approveWithdrawal(id: string): Promise<void> {
  withdrawals = withdrawals.filter((w) => w.id !== id);
  await delay(undefined);
}

export async function rejectWithdrawal(id: string): Promise<void> {
  withdrawals = withdrawals.filter((w) => w.id !== id);
  await delay(undefined);
}

// ---------------------------------------------------------------------------
// Live: users
// ---------------------------------------------------------------------------

/** Turns a backend error into one readable message for the page to show. */
function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

type ProfileRow = {
  id: string;
  account_no: number;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  balance: number | string;
  kyc_status: PlatformUser['kycStatus'];
  status: PlatformUser['status'];
  created_at: string;
  demo_trade_outcome: PlatformUser['demoTradeOutcome'];
};

const USER_COLUMNS =
  'id, account_no, email, name, first_name, last_name, balance, kyc_status, status, created_at, demo_trade_outcome';

function displayName(r: { name: string; first_name: string; last_name: string }): string {
  return `${r.first_name} ${r.last_name}`.trim() || r.name;
}

function toUser(r: ProfileRow): PlatformUser {
  return {
    id: r.id,
    accountNo: r.account_no,
    name: displayName(r),
    email: r.email,
    balance: Number(r.balance),
    kycStatus: r.kyc_status,
    status: r.status,
    joinedAt: r.created_at,
    demoTradeOutcome: r.demo_trade_outcome,
  };
}

export async function fetchUsers(query?: string): Promise<PlatformUser[]> {
  let req = supabase.from('profiles').select(USER_COLUMNS).eq('role', 'user').order('created_at', { ascending: false }).limit(500);
  const q = query?.trim().replace(/[,()%]/g, ' ').trim();
  if (q) {
    const like = `%${q}%`;
    const filters = [`email.ilike.${like}`, `name.ilike.${like}`, `first_name.ilike.${like}`, `last_name.ilike.${like}`];
    if (/^\d+$/.test(q)) filters.push(`account_no.eq.${q}`);
    req = req.or(filters.join(','));
  }
  const { data, error } = await req;
  check(error);
  return (data as ProfileRow[]).map(toUser);
}

export async function fetchUserById(id: string): Promise<PlatformUser | undefined> {
  const { data, error } = await supabase.from('profiles').select(USER_COLUMNS).eq('id', id).maybeSingle();
  check(error);
  return data ? toUser(data as ProfileRow) : undefined;
}

/** Freezing signs the user out of the app immediately and blocks new sign-ins. */
export async function setUserStatus(id: string, status: PlatformUser['status']): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_status', { target: id, new_status: status });
  check(error);
}

/** Sandbox-only: biases this user's demo/paper-trading outcomes. Never touches real-money trades. */
export async function setDemoTradeOutcome(id: string, demoTradeOutcome: PlatformUser['demoTradeOutcome']): Promise<void> {
  await bulkSetDemoTradeOutcome([id], demoTradeOutcome);
}

/** Same as setDemoTradeOutcome but applied to a batch of users in one call. */
export async function bulkSetDemoTradeOutcome(ids: string[], demoTradeOutcome: PlatformUser['demoTradeOutcome']): Promise<void> {
  const { error } = await supabase.rpc('admin_set_demo_outcome', { targets: ids, outcome: demoTradeOutcome });
  check(error);
}

// ---------------------------------------------------------------------------
// Live: KYC
// ---------------------------------------------------------------------------

const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  passport: 'Passport',
  national_id: 'National ID',
  driver_license: 'Driver license',
};

/** "6m", "3h", "2d" since an ISO timestamp. */
function since(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / (60 * 24))}d`;
}

type KycRow = {
  id: string;
  user_id: string;
  document_type: string;
  created_at: string;
  user: {
    account_no: number;
    email: string;
    name: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    country: string | null;
    address: string;
  } | null;
  kyc_documents: { id: string; type: KycDocument['type']; label: string; storage_path: string; uploaded_at: string }[];
};

const KYC_COLUMNS = `id, user_id, document_type, created_at,
  user:profiles!user_id(account_no, email, name, first_name, last_name, date_of_birth, country, address),
  kyc_documents(id, type, label, storage_path, uploaded_at)`;

function toKycCase(r: KycRow): KycCase {
  const u = r.user;
  return {
    id: r.id,
    userId: r.user_id,
    accountNo: u?.account_no,
    userName: u ? displayName(u) : 'Deleted user',
    documentType: DOCUMENT_TYPE_LABEL[r.document_type] ?? r.document_type,
    waitingFor: since(r.created_at),
    applicant: {
      fullName: u ? `${u.first_name} ${u.last_name}`.trim() : '',
      email: u?.email ?? '',
      dateOfBirth: u?.date_of_birth ?? null,
      country: u?.country ?? null,
      address: u?.address ?? '',
    },
    documents: r.kyc_documents.map((d) => ({
      id: d.id,
      type: d.type,
      label: d.label,
      uploadedAt: d.uploaded_at,
      storagePath: d.storage_path,
    })),
  };
}

export async function fetchKycQueue(): Promise<KycCase[]> {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select(KYC_COLUMNS)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  check(error);
  return (data as unknown as KycRow[]).map(toKycCase);
}

export async function fetchKycCase(id: string): Promise<KycCase | undefined> {
  const { data, error } = await supabase.from('kyc_submissions').select(KYC_COLUMNS).eq('id', id).maybeSingle();
  check(error);
  return data ? toKycCase(data as unknown as KycRow) : undefined;
}

/** Short-lived link to view a private KYC file. */
export async function fetchKycDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('kyc-documents').createSignedUrl(storagePath, 300);
  check(error);
  return data!.signedUrl;
}

/** Approve marks the user verified; reject sends them back to resubmit, with the reason shown in the app. */
export async function decideKycCase(id: string, approve: boolean, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('admin_decide_kyc', { submission: id, approve, reason: reason?.trim() || null });
  check(error);
}

// ---------------------------------------------------------------------------
// Live: account deletion requests
// ---------------------------------------------------------------------------

type DeletionRow = {
  id: string;
  user_id: string | null;
  account_no: number | null;
  user_name: string;
  email: string;
  reason: string;
  status: DeletionRequest['status'];
  created_at: string;
  decided_at: string | null;
};

export async function fetchDeletionRequests(status: DeletionRequest['status'] | 'all' = 'pending'): Promise<DeletionRequest[]> {
  let req = supabase
    .from('account_deletion_requests')
    .select('id, user_id, account_no, user_name, email, reason, status, created_at, decided_at')
    .order('created_at', { ascending: status === 'pending' })
    .limit(200);
  if (status !== 'all') req = req.eq('status', status);
  const { data, error } = await req;
  check(error);
  return (data as DeletionRow[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    accountNo: r.account_no,
    userName: r.user_name,
    email: r.email,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
  }));
}

/**
 * Approving permanently deletes the account: the user's KYC files are removed from
 * storage first, then the database deletes the login, profile and KYC records.
 */
export async function decideDeletionRequest(request: DeletionRequest, approve: boolean): Promise<void> {
  if (approve && request.userId) {
    const bucket = supabase.storage.from('kyc-documents');
    const { data: files, error: listError } = await bucket.list(request.userId, { limit: 1000 });
    check(listError);
    if (files && files.length > 0) {
      const { error: removeError } = await bucket.remove(files.map((f) => `${request.userId}/${f.name}`));
      check(removeError);
    }
  }
  const { error } = await supabase.rpc('admin_decide_deletion', { request: request.id, approve });
  check(error);
}

/** Pending counts for the sidebar badges. */
export async function fetchPendingReviewCounts(): Promise<{ kyc: number; deletions: number }> {
  const [kyc, deletions] = await Promise.all([
    supabase.from('kyc_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('account_deletion_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  return { kyc: kyc.count ?? 0, deletions: deletions.count ?? 0 };
}

// ---------------------------------------------------------------------------
// Mock (not yet connected): withdrawals above, ledger, disputes, notifications below
// ---------------------------------------------------------------------------

export async function fetchLedger(): Promise<LedgerTransaction[]> {
  return delay(mockLedger);
}

export async function fetchDisputes(): Promise<DisputeCase[]> {
  return delay(disputes);
}

export async function resolveDispute(id: string): Promise<void> {
  disputes = disputes.map((d) => (d.id === id ? { ...d, status: 'resolved' as const } : d));
  await delay(undefined);
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return delay(notifications);
}

export async function markNotificationRead(id: string): Promise<void> {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  await delay(undefined);
}

export async function markAllNotificationsRead(): Promise<void> {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  await delay(undefined);
}
