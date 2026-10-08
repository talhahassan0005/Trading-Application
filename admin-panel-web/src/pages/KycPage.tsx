import { useEffect, useState } from 'react';
import { ShieldCheck, IdCard, ScanFace, FileText, Loader2, type LucideIcon } from 'lucide-react';
import { decideKycCase, fetchKycDocumentUrl, fetchKycQueue } from '../api/adminService';
import type { KycCase, KycDocument } from '../types/models';
import { useConfirm } from '../context/ConfirmDialogContext';
import { Card, Text, Divider, Button, EmptyState, Dialog, Textarea } from '../components';

const DOC_ICON: Record<KycDocument['type'], LucideIcon> = {
  passport: IdCard,
  id_front: IdCard,
  id_back: IdCard,
  driver_license: IdCard,
  national_id: IdCard,
  selfie: ScanFace,
  proof_of_address: FileText,
};

const accountLabel = (c: KycCase) => (c.accountNo ? `#${c.accountNo}` : c.userId.slice(0, 8));

export function KycPage() {
  const [queue, setQueue] = useState<KycCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<'approve' | 'reject' | null>(null);
  const [viewingDoc, setViewingDoc] = useState<KycDocument | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    fetchKycQueue()
      .then((data) => {
        setQueue(data);
        setSelectedId(data[0]?.id ?? null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Private files are opened through a short-lived signed link.
  useEffect(() => {
    if (!viewingDoc?.storagePath) return;
    let active = true;
    fetchKycDocumentUrl(viewingDoc.storagePath)
      .then((url) => active && setDocUrl(url))
      .catch((e: Error) => active && setDocError(e.message));
    return () => {
      active = false;
    };
  }, [viewingDoc]);

  const selected = queue.find((c) => c.id === selectedId) ?? null;

  const decide = async (action: 'approve' | 'reject', rejectReason?: string) => {
    if (!selected) return;

    if (action === 'approve') {
      const ok = await confirm({
        title: 'Approve this KYC case?',
        description: `${selected.userName} (${accountLabel(selected)}) will be marked verified and unlocked from any KYC-gated actions.`,
        confirmLabel: 'Approve',
        tone: 'success',
      });
      if (!ok) return;
    }

    setDeciding(action);
    setError(null);
    try {
      await decideKycCase(selected.id, action === 'approve', rejectReason);
      setRejecting(false);
      setReason('');
      setQueue((prev) => {
        const next = prev.filter((c) => c.id !== selected.id);
        setSelectedId(next[0]?.id ?? null);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the decision.');
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div>
      <Text variant="title" className="mb-4">
        KYC review
      </Text>

      {error ? (
        <Text variant="bodySmall" color="text-danger" className="mb-4">
          {error}
        </Text>
      ) : null}

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
                      {accountLabel(item)} · {item.documentType}
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
                {selected.userName} · {accountLabel(selected)}
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
                      onClick={() => {
                        setDocUrl(null);
                        setDocError(null);
                        setViewingDoc(doc);
                      }}
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

              <Text variant="label" color="text-ink-muted" className="mt-5 mb-1 block">
                Details entered in the app — compare with the documents
              </Text>
              <div>
                <DetailRow label="Full name" value={selected.applicant.fullName} />
                <Divider />
                <DetailRow label="Date of birth" value={selected.applicant.dateOfBirth} />
                <Divider />
                <DetailRow label="Country" value={selected.applicant.country} />
                <Divider />
                <DetailRow label="Address" value={selected.applicant.address} />
                <Divider />
                <DetailRow label="Email" value={selected.applicant.email} />
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
                  disabled={deciding !== null}
                  onClick={() => setRejecting(true)}
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
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-surface-alt">
              {docUrl ? (
                <a href={docUrl} target="_blank" rel="noreferrer" title="Open full size in a new tab">
                  <img src={docUrl} alt={viewingDoc.label} className="max-h-[60vh] w-full object-contain" />
                </a>
              ) : docError ? (
                <Text variant="bodySmall" color="text-danger">
                  Could not load this file: {docError}
                </Text>
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
              )}
            </div>
            <Text variant="caption" color="text-ink-muted" className="mt-3">
              Uploaded {new Date(viewingDoc.uploadedAt).toLocaleString('en-US')}
            </Text>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        title="Reject this KYC case?"
        description={selected ? `${selected.userName} (${accountLabel(selected)}) will need to resubmit. The reason is shown to them in the app.` : undefined}
        footer={
          <>
            <Button label="Cancel" variant="secondary" size="sm" onClick={() => setRejecting(false)} />
            <Button
              label="Reject"
              variant="danger"
              size="sm"
              loading={deciding === 'reject'}
              disabled={!reason.trim()}
              onClick={() => decide('reject', reason)}
            />
          </>
        }
      >
        <Textarea
          label="Reason"
          placeholder="e.g. The photo of the ID is blurry — please upload a clearer one."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <Text variant="bodySmall" color="text-ink-secondary">
        {label}
      </Text>
      <Text variant="bodySmall" color={value ? undefined : 'text-ink-muted'} className="text-right">
        {value || 'Not provided'}
      </Text>
    </div>
  );
}
