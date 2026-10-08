/**
 * Backend service — every server call the app makes goes through here.
 * Stores and screens never touch `supabase` directly, so moving to a custom
 * Node.js API later only means rewriting the bodies in this file.
 */
import type { RealtimeChannel, User as AuthUser } from '@supabase/supabase-js';
import { backendConfigured, supabase } from './supabase';

export type AccountStatus = 'active' | 'frozen';
export type KycState = 'unverified' | 'pending' | 'verified' | 'rejected';
export type IdDocumentType = 'passport' | 'national_id' | 'driver_license';
export type KycFileType = 'passport' | 'id_front' | 'id_back' | 'proof_of_address';

export interface Profile {
  id: string;
  accountNo: number;
  email: string;
  name: string;
  status: AccountStatus;
  kycStatus: KycState;
  nickname: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null; // "YYYY-MM-DD"
  country: string | null;
  currency: string;
  address: string;
}

export type PersonalData = Pick<Profile, 'nickname' | 'firstName' | 'lastName' | 'dateOfBirth' | 'country' | 'address'>;

export interface KycFile {
  type: KycFileType;
  label: string;
  uri: string;
  mimeType?: string | null;
}

export interface DeletionRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/** Thrown for anything the user should see as a message. */
export class BackendError extends Error {}

export const FROZEN_MESSAGE = 'Your account has been frozen. Please contact support.';
const NOT_CONFIGURED = 'The app is not connected to a server yet. Add your Supabase keys to mobile-app/.env.local and restart.';

function fail(error: { message?: string } | null | undefined, fallback = 'Something went wrong. Please try again.'): never {
  const msg = error?.message ?? '';
  if (/invalid login credentials/i.test(msg)) throw new BackendError('Incorrect email or password.');
  if (/user already registered/i.test(msg)) throw new BackendError('An account with this email already exists. Sign in instead.');
  if (/token has expired|otp.*(expired|invalid)|invalid.*otp/i.test(msg)) throw new BackendError('That code is wrong or has expired. Request a new one.');
  if (/rate limit|too many/i.test(msg)) throw new BackendError('Too many attempts. Please wait a minute and try again.');
  if (/network request failed|fetch failed/i.test(msg)) throw new BackendError('No connection to the server. Check your internet and try again.');
  throw new BackendError(msg || fallback);
}

function requireConfig() {
  if (!backendConfigured) throw new BackendError(NOT_CONFIGURED);
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Restores the saved session on app start. */
export async function currentUser(): Promise<AuthUser | null> {
  if (!backendConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export type SignInResult = { kind: 'signed-in'; user: AuthUser } | { kind: 'needs-code' };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  requireConfig();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Signed up but never entered the emailed code: send a fresh one and go to the code screen.
    if (/email not confirmed/i.test(error.message)) {
      await supabase.auth.resend({ type: 'signup', email });
      return { kind: 'needs-code' };
    }
    fail(error);
  }
  return { kind: 'signed-in', user: data.user };
}

export interface SignUpDetails {
  country: string | null;
  currency: string;
}

/** Returns the signed-in user when email confirmation is off, otherwise null (a code was emailed). */
export async function signUp(email: string, password: string, details: SignUpDetails): Promise<AuthUser | null> {
  requireConfig();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { country: details.country ?? '', currency: details.currency } },
  });
  if (error) fail(error);
  // Supabase hides "already registered" behind an empty identities list.
  if (data.user && data.user.identities?.length === 0) {
    throw new BackendError('An account with this email already exists. Sign in instead.');
  }
  return data.session ? data.user : null;
}

export async function verifyEmailCode(email: string, code: string): Promise<AuthUser> {
  requireConfig();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error || !data.user) fail(error);
  return data.user;
}

export async function resendSignUpCode(email: string): Promise<void> {
  requireConfig();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) fail(error);
}

export async function signOut(): Promise<void> {
  if (!backendConfigured) return;
  await supabase.auth.signOut();
}

/** Fires when the session ends anywhere (sign-out, token revoked, account deleted). */
export function onSignedOut(callback: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') callback();
  });
  return () => data.subscription.unsubscribe();
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

type ProfileRow = {
  id: string;
  account_no: number;
  email: string;
  name: string;
  status: AccountStatus;
  kyc_status: KycState;
  nickname: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  country: string | null;
  currency: string;
  address: string;
};

const PROFILE_COLUMNS =
  'id, account_no, email, name, status, kyc_status, nickname, first_name, last_name, date_of_birth, country, currency, address';

function toProfile(r: ProfileRow): Profile {
  return {
    id: r.id,
    accountNo: r.account_no,
    email: r.email,
    name: r.name,
    status: r.status,
    kycStatus: r.kyc_status,
    nickname: r.nickname,
    firstName: r.first_name,
    lastName: r.last_name,
    dateOfBirth: r.date_of_birth,
    country: r.country,
    currency: r.currency,
    address: r.address,
  };
}

export async function fetchMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).single();
  if (error || !data) fail(error, 'Could not load your account.');
  return toProfile(data as ProfileRow);
}

export async function updatePersonalData(userId: string, patch: PersonalData): Promise<void> {
  if (patch.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(patch.dateOfBirth)) {
    throw new BackendError('Enter your date of birth as YYYY-MM-DD.');
  }
  const { error } = await supabase
    .from('profiles')
    .update({
      nickname: patch.nickname,
      first_name: patch.firstName.trim(),
      last_name: patch.lastName.trim(),
      date_of_birth: patch.dateOfBirth || null,
      country: patch.country,
      address: patch.address.trim(),
    })
    .eq('id', userId);
  if (error) fail(error, 'Could not save your details.');
}

/** Live updates to the signed-in user's own profile row (freeze, KYC decisions). */
export function subscribeToMyProfile(userId: string, onChange: (p: Profile) => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel(`profile:${userId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) =>
      onChange(toProfile(payload.new as ProfileRow))
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// KYC
// ---------------------------------------------------------------------------

/** Rejection reason of the most recent submission, if it was rejected. */
export async function fetchKycRejectionReason(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('kyc_submissions')
    .select('status, rejection_reason')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.status === 'rejected' ? (data.rejection_reason ?? '') : null;
}

export async function submitKyc(userId: string, documentType: IdDocumentType, files: KycFile[]): Promise<void> {
  requireConfig();
  const uploaded: Array<{ type: KycFileType; label: string; path: string }> = [];
  for (const file of files) {
    const contentType = file.mimeType || 'image/jpeg';
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const path = `${userId}/${Date.now()}-${file.type}.${ext}`;
    const body = await (await fetch(file.uri)).arrayBuffer();
    const { error } = await supabase.storage.from('kyc-documents').upload(path, body, { contentType });
    if (error) fail(error, 'Could not upload your document. Please try again.');
    uploaded.push({ type: file.type, label: file.label, path });
  }
  const { error } = await supabase.rpc('submit_kyc', { document_type: documentType, documents: uploaded });
  if (error) fail(error, 'Could not submit your documents.');
}

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

export async function fetchPendingDeletion(userId: string): Promise<DeletionRequest | null> {
  const { data } = await supabase
    .from('account_deletion_requests')
    .select('id, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();
  return data ? { id: data.id, status: data.status, createdAt: data.created_at } : null;
}

export async function requestAccountDeletion(reason: string): Promise<void> {
  requireConfig();
  const { error } = await supabase.rpc('request_account_deletion', { reason });
  if (error) fail(error, 'Could not send your request.');
}

export async function cancelAccountDeletion(): Promise<void> {
  requireConfig();
  const { error } = await supabase.rpc('cancel_account_deletion');
  if (error) fail(error, 'Could not cancel your request.');
}
