import { useEffect, useState } from 'react';
import { ShieldCheck, IdCard, ScanFace, type LucideIcon } from 'lucide-react';
import { decideKycCase, fetchKycQueue } from '../api/adminService';
import type { KycCase, KycDocument } from '../types/models';
import { useConfirm } from '../context/ConfirmDialogContext';
import { Card, Text, Divider, StatusPill, Button, EmptyState, Dialog } from '../components';
import { toneForStatus } from '../utils/status';

const CHECK_LABEL: Record<string, string> = {
  pass: 'Pass',
  fail: 'Fail',
  manual: 'Manual',
  valid: 'Valid',
  expired: 'Expired',
};

const DOC_ICON: Record<KycDocument['type'], LucideIcon> = {
  passport: IdCard,
  id_front: IdCard,
  id_back: IdCard,
  driver_license: IdCard,
  national_id: IdCard,
  selfie: ScanFace,
};

export function KycPage() {
  const [queue, setQueue] = useState<KycCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null);
  const [viewingDoc, setViewingDoc] = useState<KycDocument | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    fetchKycQueue().then((data) => {
      setQueue(data);
      setSelectedId(data[0]?.id ?? null);
      setLoading(false);
    });
  }, []);

  const selected = queue.find((c) => c.id === selectedId) ?? null;

  const decide = async (action: 'approve' | 'reject') => {
    if (!selected) return;

    const ok = await confirm(
      action === 'approve'
        ? {
            title: 'Approve this KYC case?',
            description: `${selected.userName} (${selected.userId}) will be marked verified and unlocked from any KYC-gated actions.`,
            confirmLabel: 'Approve',
            tone: 'success',
          }
        : {
            title: 'Reject this KYC case?',
            description: `${selected.userName} (${selected.userId}) will need to resubmit their documents.`,
            confirmLabel: 'Reject',
            tone: 'danger',
          }
    );
    if (!ok) return;

    setDeciding(action);
    try {
      await decideKycCase(selected.id);
      setQueue((prev) => {
        const next = prev.filter((c) => c.id !== selected.id);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div>
      <Text variant="title" className="mb-4">
        KYC review
      </Text>

      {!loading && queue.length === 0 ? (
        <Card>
          <EmptyState icon={ShieldCheck} title="Queue is empty" description="No KYC cases waiting for review." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <Card padded={false}>
            <div className="p-5 pb-3">
              <Text variant="sectionTitle">Review queue</Text>
              <Text variant="caption" color="text-ink-muted">
                {queue.length} awaiting review
              </Text>
            </div>
            {queue.map((item, idx) => (
              <div key={item.id}>
                {idx > 0 ? <Divider className="mx-5" /> : null}
                <button
                  onClick={() => setSelectedId(item.id)}
                  className={`flex w-full items-center justify-between px-5 py-3 text-left cursor-pointer ${
                    item.id === selectedId ? 'bg-surface-alt' : 'hover:bg-surface-alt/60'
                  }`}
                >
                  <div>
                    <Text variant="bodyMedium">{item.userName}</Text>
                    <Text variant="caption" color="text-ink-muted">
                      {item.userId} · {item.documentType}
                    </Text>
                  </div>
                  <Text variant="bodySmall" color="text-info">
                    {item.waitingFor}
                  </Text>
                </button>
              </div>
            ))}
          </Card>

          {selected ? (
            <Card>
              <Text variant="sectionTitle">
                {selected.userName} · {selected.userId}
              </Text>

              <Text variant="label" color="text-ink-muted" className="mt-4 mb-2 block">
                Submitted documents
              </Text>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selected.documents.map((doc) => {
                  const Icon = DOC_ICON[doc.type];
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setViewingDoc(doc)}
                      className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-surface-alt px-2 text-center hover:border-accent cursor-pointer"
                    >
                      <Icon className="h-6 w-6 text-ink-muted" />
                      <Text variant="caption" color="text-ink-secondary">
                        {doc.label}
                      </Text>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <CheckRow label="Name match" value={selected.nameMatch} />
                <Divider />
                <CheckRow label="Document expiry" value={selected.documentExpiry} />
                <Divider />
                <CheckRow label="Face match" value={selected.faceMatch} />
              </div>

              <div className="mt-5 flex gap-3">
                <Button
                  label="Approve"
                  variant="success"
                  loading={deciding === 'approve'}
                  onClick={() => decide('approve')}
                />
                <Button
                  label="Reject"
                  variant="danger"
                  loading={deciding === 'reject'}
                  onClick={() => decide('reject')}
                />
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <Dialog
        open={viewingDoc != null}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.label ?? ''}
        footer={<Button label="Close" variant="secondary" size="sm" onClick={() => setViewingDoc(null)} />}
      >
        {viewingDoc ? (
          <div>
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg bg-surface-alt">
              {(() => {
                const Icon = DOC_ICON[viewingDoc.type];
                return <Icon className="h-10 w-10 text-ink-muted" />;
              })()}
              <Text variant="bodySmall" color="text-ink-muted">
                No file storage in this demo — this stands in for the uploaded scan.
              </Text>
            </div>
            <Text variant="caption" color="text-ink-muted" className="mt-3">
              Uploaded {new Date(viewingDoc.uploadedAt).toLocaleString('en-US')}
            </Text>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function CheckRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <Text variant="bodySmall" color="text-ink-secondary">
        {label}
      </Text>
      <StatusPill label={CHECK_LABEL[value] ?? value} tone={toneForStatus(value)} />
    </div>
  );
}
