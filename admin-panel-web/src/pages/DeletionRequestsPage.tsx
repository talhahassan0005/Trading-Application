import { useState } from 'react';
import { AlertTriangle, Check, UserX, X } from 'lucide-react';
import { decideDeletionRequest, fetchDeletionRequests } from '../api/adminService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useConfirm } from '../context/ConfirmDialogContext';
import { Card, Text, StatusPill, Button, EmptyState, Table, THead, TBody, TRow, TH, TD, Tabs, type TabOption } from '../components';
import { toneForStatus } from '../utils/status';
import type { DeletionRequest, DeletionRequestStatus } from '../types/models';

const TAB_OPTIONS: TabOption<DeletionRequestStatus>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const who = (r: DeletionRequest) => r.userName || r.email;

export function DeletionRequestsPage() {
  const [tab, setTab] = useState<DeletionRequestStatus>('pending');
  const { data, loading, setData } = useAsyncData(() => fetchDeletionRequests(tab), [] as DeletionRequest[], [tab]);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const act = async (r: DeletionRequest, approve: boolean) => {
    const ok = await confirm(
      approve
        ? {
            title: 'Delete this account permanently?',
            description: `${who(r)} (#${r.accountNo}) will be signed out and their login, profile and KYC documents deleted. This cannot be undone.`,
            confirmLabel: 'Delete account',
            tone: 'danger',
          }
        : {
            title: 'Reject this deletion request?',
            description: `${who(r)}'s account stays active. They can send a new request from the app.`,
            confirmLabel: 'Reject request',
            tone: 'success',
          }
    );
    if (!ok) return;

    setActingId(r.id);
    setError(null);
    try {
      await decideDeletionRequest(r, approve);
      setData((prev) => prev.filter((item) => item.id !== r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the decision.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <Text variant="title">Account deletion requests</Text>
      <Text variant="bodySmall" color="text-ink-secondary" className="mt-1 mb-4">
        Users ask to delete their account from the app's Profile screen.
      </Text>

      <div className="mb-4">
        <Tabs options={TAB_OPTIONS} value={tab} onChange={setTab} />
      </div>

      {tab === 'pending' && data.length > 0 ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-warning-bg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <Text variant="bodySmall" color="text-warning">
            Approving permanently deletes the user's account and documents. Check for open balances or disputes first.
          </Text>
        </div>
      ) : null}

      {error ? (
        <Text variant="bodySmall" color="text-danger" className="mb-4">
          {error}
        </Text>
      ) : null}

      <Card padded={false}>
        {!loading && data.length === 0 ? (
          <EmptyState icon={UserX} title="Nothing here" description={`No ${tab} deletion requests.`} />
        ) : (
          <Table>
            <THead>
              <TRow className="hover:bg-transparent">
                <TH>User</TH>
                <TH>Requested</TH>
                <TH>Reason</TH>
                <TH>{tab === 'pending' ? 'Action' : 'Status'}</TH>
              </TRow>
            </THead>
            <TBody>
              {data.map((r) => (
                <TRow key={r.id}>
                  <TD>
                    <Text variant="bodyMedium">{who(r)}</Text>
                    <Text variant="caption" color="text-ink-muted">
                      {r.accountNo ? `#${r.accountNo} · ` : ''}
                      {r.email}
                    </Text>
                  </TD>
                  <TD>
                    <Text variant="bodySmall" color="text-ink-secondary">
                      {formatDate(r.createdAt)}
                    </Text>
                  </TD>
                  <TD>
                    <Text variant="bodySmall" color="text-ink-secondary">
                      {r.reason || '—'}
                    </Text>
                  </TD>
                  <TD>
                    {tab === 'pending' ? (
                      <div className="flex gap-2">
                        <Button
                          label="Approve & delete"
                          icon={Check}
                          variant="danger"
                          size="sm"
                          loading={actingId === r.id}
                          disabled={actingId !== null}
                          onClick={() => act(r, true)}
                        />
                        <Button
                          label="Reject"
                          icon={X}
                          variant="secondary"
                          size="sm"
                          disabled={actingId !== null}
                          onClick={() => act(r, false)}
                        />
                      </div>
                    ) : (
                      <div>
                        <StatusPill label={r.status} tone={toneForStatus(r.status)} />
                        {r.decidedAt ? (
                          <Text variant="caption" color="text-ink-muted" className="mt-1">
                            {formatDate(r.decidedAt)}
                          </Text>
                        ) : null}
                      </div>
                    )}
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
