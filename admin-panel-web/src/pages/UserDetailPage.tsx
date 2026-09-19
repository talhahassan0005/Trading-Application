import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, TrendingUp, TrendingDown, Shuffle, Loader2, type LucideIcon } from 'lucide-react';
import { fetchUserById, setUserStatus, setDemoTradeOutcome } from '../api/adminService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useConfirm } from '../context/ConfirmDialogContext';
import { Card, Text, Avatar, Divider, StatusPill, Button } from '../components';
import { formatCurrency } from '../utils/formatters';
import { toneForStatus, type StatusTone } from '../utils/status';
import { formatJoinedAt, segmentForUser, SEGMENT_LABEL } from '../utils/segment';
import type { DemoTradeOutcome } from '../types/models';

const OUTCOME_OPTIONS: { value: DemoTradeOutcome; label: string; icon: LucideIcon; tone: StatusTone }[] = [
  { value: 'profit', label: 'Profit', icon: TrendingUp, tone: 'success' },
  { value: 'moderate', label: 'Moderate', icon: Shuffle, tone: 'warning' },
  { value: 'loss', label: 'Loss', icon: TrendingDown, tone: 'danger' },
];

const OUTCOME_ACTIVE_CLASSES: Record<string, string> = {
  success: 'border-success bg-success-bg text-success',
  warning: 'border-warning bg-warning-bg text-warning',
  danger: 'border-danger bg-danger-bg text-danger',
};

const OUTCOME_TEXT_COLOR: Record<string, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function UserDetailPage() {
  const { userId = '' } = useParams();
  const navigate = useNavigate();
  const { data: user, setData } = useAsyncData(() => fetchUserById(userId), undefined, [userId]);
  const [updating, setUpdating] = useState(false);
  const [updatingOutcome, setUpdatingOutcome] = useState<DemoTradeOutcome | null>(null);
  const confirm = useConfirm();

  const toggleStatus = async () => {
    if (!user) return;
    const next = user.status === 'active' ? 'frozen' : 'active';

    const ok = await confirm(
      next === 'frozen'
        ? {
            title: 'Freeze this account?',
            description: `${user.name} (${user.id}) will lose the ability to trade, deposit or withdraw until unfrozen.`,
            confirmLabel: 'Freeze account',
            tone: 'danger',
          }
        : {
            title: 'Unfreeze this account?',
            description: `${user.name} (${user.id}) will regain full access immediately.`,
            confirmLabel: 'Unfreeze account',
            tone: 'success',
          }
    );
    if (!ok) return;

    setUpdating(true);
    try {
      await setUserStatus(user.id, next);
      setData({ ...user, status: next });
    } finally {
      setUpdating(false);
    }
  };

  const setOutcome = async (mode: DemoTradeOutcome) => {
    if (!user || mode === user.demoTradeOutcome) return;
    setUpdatingOutcome(mode);
    try {
      await setDemoTradeOutcome(user.id, mode);
      setData({ ...user, demoTradeOutcome: mode });
    } finally {
      setUpdatingOutcome(null);
    }
  };

  if (!user) return null;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </button>

      <div className="stagger grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr] lg:items-start">
        <Card>
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.name} size="xl" />
            <Text variant="title" className="mt-3">
              {user.name}
            </Text>
            <Text variant="bodySmall" color="text-ink-muted">
              {user.email}
            </Text>
            <Text variant="caption" color="text-ink-muted" className="mt-0.5">
              {user.id}
            </Text>
          </div>

          <Divider className="my-5" />

          <Row label="Balance" value={<Text variant="bodyMedium">{formatCurrency(user.balance)}</Text>} />
          <Row label="KYC status" value={<StatusPill label={user.kycStatus} tone={toneForStatus(user.kycStatus)} />} />
          <Row label="Account status" value={<StatusPill label={user.status} tone={toneForStatus(user.status)} />} />
          <Row
            label="Segment"
            value={<Text variant="bodyMedium">{SEGMENT_LABEL[segmentForUser(user.joinedAt)]}</Text>}
          />
          <Row
            label="Joined"
            value={<Text variant="bodyMedium">{formatJoinedAt(user.joinedAt)}</Text>}
            last
          />

          <Button
            label={user.status === 'active' ? 'Freeze account' : 'Unfreeze account'}
            variant={user.status === 'active' ? 'danger' : 'success'}
            icon={user.status === 'active' ? Lock : Unlock}
            onClick={toggleStatus}
            loading={updating}
            fullWidth
            className="mt-5"
          />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-1">
            <Text variant="sectionTitle">Trade Mode</Text>
            <StatusPill label={user.demoTradeOutcome} tone={toneForStatus(user.demoTradeOutcome)} />
          </div>
          <Text variant="bodySmall" color="text-ink-secondary" className="mb-4">
            This is the outcome of the user's trades. You can change it to simulate different scenarios.
          </Text>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {OUTCOME_OPTIONS.map((opt) => {
              const active = user.demoTradeOutcome === opt.value;
              const busy = updatingOutcome === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setOutcome(opt.value)}
                  disabled={active || updatingOutcome !== null}
                  className={[
                    'flex flex-col items-center gap-2 rounded-lg border px-4 py-4 transition-all duration-200',
                    'disabled:cursor-not-allowed',
                    active
                      ? OUTCOME_ACTIVE_CLASSES[opt.tone]
                      : 'border-border text-ink-secondary hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-alt hover:shadow-md active:translate-y-0 active:scale-[0.97] cursor-pointer',
                  ].join(' ')}
                >
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <opt.icon className={`h-5 w-5 ${active ? 'animate-pop-in' : ''}`} />
                  )}
                  <Text variant="bodySmall" color={active ? OUTCOME_TEXT_COLOR[opt.tone] : undefined}>
                    {opt.label}
                  </Text>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${last ? '' : 'mb-3'}`}>
      <Text variant="bodySmall" color="text-ink-secondary">
        {label}
      </Text>
      {value}
    </div>
  );
}
