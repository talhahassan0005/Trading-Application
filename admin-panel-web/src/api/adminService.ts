import {
  mockActivity,
  mockDisputes,
  mockKycQueue,
  mockLedger,
  mockNotifications,
  mockOverviewStats,
  mockUsers,
  mockWithdrawals,
} from './mockData';
import type {
  ActivityItem,
  DisputeCase,
  KycCase,
  LedgerTransaction,
  NotificationItem,
  OverviewStats,
  PlatformUser,
  WithdrawalRequest,
} from '../types/models';

/**
 * Mock back-office API. Every page calls through here instead of importing
 * mockData directly — swap the bodies below for real `fetch` calls later
 * and no page code needs to change.
 */
const DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

let withdrawals = [...mockWithdrawals];
let users = [...mockUsers];
let kycQueue = [...mockKycQueue];
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

export async function fetchUsers(query?: string): Promise<PlatformUser[]> {
  const list = query
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()) ||
          u.id.toLowerCase().includes(query.toLowerCase())
      )
    : users;
  return delay(list);
}

export async function fetchUserById(id: string): Promise<PlatformUser | undefined> {
  return delay(users.find((u) => u.id === id));
}

export async function setUserStatus(id: string, status: PlatformUser['status']): Promise<void> {
  users = users.map((u) => (u.id === id ? { ...u, status } : u));
  await delay(undefined);
}

/** Sandbox-only: biases this user's demo/paper-trading outcomes. Never touches real-money trades. */
export async function setDemoTradeOutcome(id: string, demoTradeOutcome: PlatformUser['demoTradeOutcome']): Promise<void> {
  users = users.map((u) => (u.id === id ? { ...u, demoTradeOutcome } : u));
  await delay(undefined);
}

/** Same as setDemoTradeOutcome but applied to a batch of users in one call. */
export async function bulkSetDemoTradeOutcome(ids: string[], demoTradeOutcome: PlatformUser['demoTradeOutcome']): Promise<void> {
  const idSet = new Set(ids);
  users = users.map((u) => (idSet.has(u.id) ? { ...u, demoTradeOutcome } : u));
  await delay(undefined);
}

export async function fetchKycQueue(): Promise<KycCase[]> {
  return delay(kycQueue);
}

export async function fetchKycCase(id: string): Promise<KycCase | undefined> {
  return delay(kycQueue.find((c) => c.id === id));
}

export async function decideKycCase(id: string): Promise<void> {
  kycQueue = kycQueue.filter((c) => c.id !== id);
  await delay(undefined);
}

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
