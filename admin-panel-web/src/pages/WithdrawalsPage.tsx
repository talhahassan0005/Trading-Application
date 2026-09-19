import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { approveWithdrawal, fetchWithdrawals, rejectWithdrawal } from '../api/adminService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useConfirm } from '../context/ConfirmDialogContext';
import { Card, Text, StatusPill, Button, EmptyState, Table, THead, TBody, TRow, TH, TD } from '../components';
import { formatCurrency } from '../utils/formatters';
import { toneForStatus } from '../utils/status';

export function WithdrawalsPage() {
  const { data, loading, setData } = useAsyncData(fetchWithdrawals, []);
  const [actingId, setActingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const totalHeld = data.reduce((sum, w) => sum + w.amount, 0);

  const act = async (w: (typeof data)[number], action: 'approve' | 'reject') => {
    const ok = await confirm(
      action === 'approve'
        ? {
            title: 'Approve withdrawal?',
            description: `Release ${formatCurrency(w.amount)} to ${w.userName} (${w.userId}). This cannot be undone.`,
            confirmLabel: 'Approve',
            tone: 'success',
          }
        : {
            title: 'Reject withdrawal?',
            description: `${w.userName}'s request for ${formatCurrency(w.amount)} will be rejected and funds released back to their balance.`,
            confirmLabel: 'Reject',
            tone: 'danger',
          }
    );
    if (!ok) return;

    setActingId(w.id);
    try {
      if (action === 'approve') await approveWithdrawal(w.id);
      else await rejectWithdrawal(w.id);
      setData((prev) => prev.filter((item) => item.id !== w.id));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <Text variant="title">Withdrawal approvals</Text>
      <Text variant="bodySmall" color="text-ink-secondary" className="mt-1 mb-4">
        {data.length} pending · {formatCurrency(totalHeld)} held
      </Text>

      {data.length > 0 ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-warning-bg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <Text variant="bodySmall" color="text-warning">
            Funds are held in escrow until each request is actioned. Approve requires verified KYC.
          </Text>
        </div>
      ) : null}

      <Card padded={false}>
        {!loading && data.length === 0 ? (
          <EmptyState title="All caught up" description="No pending withdrawal requests." />
        ) : (
          <Table>
            <THead>
              <TRow className="hover:bg-transparent">
                <TH>Request</TH>
                <TH>Amount</TH>
                <TH>Method</TH>
                <TH>KYC</TH>
                <TH>Action</TH>
              </TRow>
            </THead>
            <TBody>
              {data.map((w) => (
                <TRow key={w.id}>
                  <TD>
                    <Text variant="bodyMedium">{w.userName}</Text>
                    <Text variant="caption" color="text-ink-muted">
                      {w.id} · {w.userId} · {w.requestedAgo}
                    </Text>
                  </TD>
                  <TD>
                    <Text variant="bodyMedium">{formatCurrency(w.amount)}</Text>
                  </TD>
                  <TD>{w.method}</TD>
                  <TD>
                    <StatusPill label={w.kycStatus} tone={toneForStatus(w.kycStatus)} />
                  </TD>
                  <TD>
                    <div className="flex gap-2">
                      <Button
                        label="Approve"
                        icon={Check}
                        variant="success"
                        size="sm"
                        disabled={w.kycStatus !== 'verified'}
                        loading={actingId === w.id}
                        onClick={() => act(w, 'approve')}
                      />
                      <Button
                        label="Reject"
                        icon={X}
                        variant="danger"
                        size="sm"
                        loading={actingId === w.id}
                        onClick={() => act(w, 'reject')}
                      />
                    </div>
                  </TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
