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

export const mockOverviewStats: OverviewStats = {
  pendingWithdrawals: 3,
  pendingWithdrawalsHeld: 1750,
  depositsToday: 48200,
  depositsChangePct: 12,
  activeUsers24h: 1284,
  openDisputes: 2,
};

export const mockActivity: ActivityItem[] = [
  { id: 'a1', type: 'withdrawal', title: 'Withdrawal requested', subtitle: 'u_1042 · $400.00', timeAgo: '6m ago' },
  { id: 'a2', type: 'deposit', title: 'Deposit confirmed', subtitle: 'u_0781 · $1,200.00', timeAgo: '9m ago' },
  { id: 'a3', type: 'kyc', title: 'KYC submitted', subtitle: 'u_1190 · ID document', timeAgo: '14m ago' },
  { id: 'a4', type: 'trade', title: 'Trade settled', subtitle: 'u_0455 · +$85.00', timeAgo: '16m ago' },
  { id: 'a5', type: 'dispute', title: 'Dispute opened', subtitle: 'u_0912 · chargeback', timeAgo: '31m ago' },
];

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', type: 'withdrawal', title: 'Withdrawal requested', subtitle: 'Maya R. · $400.00', timeAgo: '6m ago', read: false },
  { id: 'n2', type: 'dispute', title: 'New dispute opened', subtitle: 'Lena K. · chargeback', timeAgo: '31m ago', read: false },
  { id: 'n3', type: 'kyc', title: 'KYC submitted', subtitle: 'Ravi S. · ID document', timeAgo: '1h ago', read: false },
  { id: 'n4', type: 'deposit', title: 'Large deposit confirmed', subtitle: 'Jon P. · $1,200.00', timeAgo: '2h ago', read: true },
  { id: 'n5', type: 'trade', title: 'Trade settled', subtitle: 'Sam T. · +$85.00', timeAgo: '3h ago', read: true },
];

export const mockWithdrawals: WithdrawalRequest[] = [
  { id: 'wd_9a2', userId: 'u_1042', userName: 'Maya R.', amount: 400, method: 'E-wallet', kycStatus: 'verified', requestedAgo: '6m' },
  { id: 'wd_9b7', userId: 'u_0781', userName: 'Jon P.', amount: 1200, method: 'Crypto', kycStatus: 'verified', requestedAgo: '22m' },
  { id: 'wd_9c1', userId: 'u_1190', userName: 'Ravi S.', amount: 150, method: 'Card', kycStatus: 'pending', requestedAgo: '1h' },
];

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export const mockUsers: PlatformUser[] = [
  { id: 'u_1042', name: 'Maya R.', email: 'maya@example.com', balance: 1250, kycStatus: 'verified', status: 'active', joinedAt: daysAgo(3), demoTradeOutcome: 'moderate' },
  { id: 'u_0781', name: 'Jon P.', email: 'jon@example.com', balance: 4010, kycStatus: 'verified', status: 'active', joinedAt: daysAgo(64), demoTradeOutcome: 'moderate' },
  { id: 'u_1190', name: 'Ravi S.', email: 'ravi@example.com', balance: 320, kycStatus: 'pending', status: 'active', joinedAt: daysAgo(7), demoTradeOutcome: 'moderate' },
  { id: 'u_0912', name: 'Lena K.', email: 'lena@example.com', balance: 0, kycStatus: 'verified', status: 'frozen', joinedAt: daysAgo(410), demoTradeOutcome: 'moderate' },
  { id: 'u_0455', name: 'Sam T.', email: 'sam@example.com', balance: 780, kycStatus: 'verified', status: 'active', joinedAt: daysAgo(92), demoTradeOutcome: 'moderate' },
];

export const mockKycQueue: KycCase[] = [
  {
    id: 'kyc_1',
    userId: 'u_1190',
    userName: 'Ravi S.',
    documentType: 'Passport',
    waitingFor: '1h',
    nameMatch: 'pass',
    documentExpiry: 'valid',
    faceMatch: 'manual',
    documents: [
      { id: 'doc_1a', type: 'passport', label: 'Passport photo page', uploadedAt: daysAgo(0) },
      { id: 'doc_1b', type: 'selfie', label: 'Selfie with ID', uploadedAt: daysAgo(0) },
    ],
  },
  {
    id: 'kyc_2',
    userId: 'u_1201',
    userName: 'Ana D.',
    documentType: 'Driver license',
    waitingFor: '2h',
    nameMatch: 'pass',
    documentExpiry: 'valid',
    faceMatch: 'pass',
    documents: [
      { id: 'doc_2a', type: 'id_front', label: 'License — front', uploadedAt: daysAgo(0) },
      { id: 'doc_2b', type: 'id_back', label: 'License — back', uploadedAt: daysAgo(0) },
      { id: 'doc_2c', type: 'selfie', label: 'Selfie with ID', uploadedAt: daysAgo(0) },
    ],
  },
  {
    id: 'kyc_3',
    userId: 'u_1215',
    userName: 'Omar H.',
    documentType: 'National ID',
    waitingFor: '3h',
    nameMatch: 'manual',
    documentExpiry: 'valid',
    faceMatch: 'pass',
    documents: [
      { id: 'doc_3a', type: 'national_id', label: 'National ID — front', uploadedAt: daysAgo(0) },
      { id: 'doc_3b', type: 'id_back', label: 'National ID — back', uploadedAt: daysAgo(0) },
      { id: 'doc_3c', type: 'selfie', label: 'Selfie with ID', uploadedAt: daysAgo(0) },
    ],
  },
  {
    id: 'kyc_4',
    userId: 'u_1230',
    userName: 'Ivy L.',
    documentType: 'Passport',
    waitingFor: '5h',
    nameMatch: 'pass',
    documentExpiry: 'expired',
    faceMatch: 'fail',
    documents: [
      { id: 'doc_4a', type: 'passport', label: 'Passport photo page', uploadedAt: daysAgo(0) },
      { id: 'doc_4b', type: 'selfie', label: 'Selfie with ID', uploadedAt: daysAgo(0) },
    ],
  },
];

export const mockLedger: LedgerTransaction[] = [
  {
    txId: 'tx_4a1',
    type: 'deposit',
    rows: [
      { account: 'user:1042', amount: 100, balance: 1350 },
      { account: 'system:gateway', amount: -100, balance: null },
    ],
  },
  {
    txId: 'tx_4b7',
    type: 'trade_stake',
    rows: [
      { account: 'user:1042', amount: -50, balance: 1300 },
      { account: 'system:house', amount: 50, balance: null },
    ],
  },
  {
    txId: 'tx_4c2',
    type: 'trade_payout',
    rows: [
      { account: 'system:house', amount: -92.5, balance: null },
      { account: 'user:1042', amount: 92.5, balance: 1392.5 },
    ],
  },
  {
    txId: 'tx_4d8',
    type: 'withdraw_hold',
    rows: [{ account: 'user:1042', amount: -400, balance: 992.5 }],
  },
];

export const mockDisputes: DisputeCase[] = [
  {
    id: 'dp_51',
    title: 'Chargeback · $500',
    amount: 500,
    userId: 'u_0912',
    description: 'Card deposit reversed by bank',
    status: 'open',
  },
  {
    id: 'dp_52',
    title: 'Withdrawal delay',
    userId: 'u_0455',
    description: 'Payout pending >48h',
    status: 'review',
  },
];

export const mockAdmin = {
  name: 'Amir K.',
  email: 'amir.k@vertex.internal',
  role: 'Finance',
};
