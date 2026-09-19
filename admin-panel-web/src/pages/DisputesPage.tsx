import { useState, type ReactNode } from 'react';
import { Flag, Send } from 'lucide-react';
import { fetchDisputes, resolveDispute } from '../api/adminService';
import { useAsyncData } from '../hooks/useAsyncData';
import { useConfirm } from '../context/ConfirmDialogContext';
import type { DisputeCase } from '../types/models';
import { Card, Text, StatusPill, Button, EmptyState, Dialog, Divider, Textarea } from '../components';
import { toneForStatus } from '../utils/status';

export function DisputesPage() {
  const { data, loading, setData } = useAsyncData(fetchDisputes, []);
  const openCount = data.filter((d) => d.status !== 'resolved').length;
  const confirm = useConfirm();

  const [viewing, setViewing] = useState<DisputeCase | null>(null);
  const [contacting, setContacting] = useState<DisputeCase | null>(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleResolve = async (dispute: DisputeCase) => {
    const ok = await confirm({
      title: 'Mark this dispute resolved?',
      description: `${dispute.title} (${dispute.id}) will be closed. This can't be reopened from here.`,
      confirmLabel: 'Resolve',
      tone: 'success',
    });
    if (!ok) return;

    await resolveDispute(dispute.id);
    setData((prev) => prev.map((d) => (d.id === dispute.id ? { ...d, status: 'resolved' as const } : d)));
  };

  const openContact = (dispute: DisputeCase) => {
    setContacting(dispute);
    setMessage('');
    setSent(false);
  };

  const sendMessage = () => {
    // Demo/simulated — no real messaging backend.
    setSent(true);
  };

  return (
    <div>
      <Text variant="title">Disputes</Text>
      <Text variant="bodySmall" color="text-ink-secondary" className="mt-1 mb-4">
        {openCount} case{openCount === 1 ? '' : 's'} need attention
      </Text>

      {!loading && data.length === 0 ? (
        <Card>
          <EmptyState icon={Flag} title="No disputes" description="Nothing needs attention right now." />
        </Card>
      ) : (
        <div className="stagger space-y-4">
          {data.map((dispute) => (
            <Card key={dispute.id}>
              <div className="flex items-start justify-between">
                <div>
                  <Text variant="bodyMedium">{dispute.title}</Text>
                  <Text variant="caption" color="text-ink-muted" className="mt-0.5">
                    {dispute.id} · {dispute.userId} — {dispute.description}
                  </Text>
                </div>
                <StatusPill label={dispute.status} tone={toneForStatus(dispute.status)} />
              </div>

              <div className="mt-4 flex gap-2">
                <Button label="View case" variant="secondary" size="sm" onClick={() => setViewing(dispute)} />
                <Button label="Contact user" variant="secondary" size="sm" onClick={() => openContact(dispute)} />
                <Button
                  label="Resolve"
                  variant="success"
                  size="sm"
                  disabled={dispute.status === 'resolved'}
                  onClick={() => handleResolve(dispute)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={viewing != null}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ''}
        footer={<Button label="Close" variant="secondary" size="sm" onClick={() => setViewing(null)} />}
      >
        {viewing ? (
          <div className="space-y-3">
            <Row label="Case ID" value={<Text variant="bodyMedium">{viewing.id}</Text>} />
            <Divider />
            <Row label="User" value={<Text variant="bodyMedium">{viewing.userId}</Text>} />
            <Divider />
            <Row label="Status" value={<StatusPill label={viewing.status} tone={toneForStatus(viewing.status)} />} />
            <Divider />
            <div>
              <Text variant="bodySmall" color="text-ink-secondary">
                Description
              </Text>
              <Text variant="body" className="mt-1">
                {viewing.description}
              </Text>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={contacting != null}
        onClose={() => setContacting(null)}
        title={`Contact ${contacting?.userId ?? ''}`}
        description={sent ? undefined : `Regarding ${contacting?.title}. This sends a message to the user's account inbox.`}
        footer={
          sent ? (
            <Button label="Done" size="sm" onClick={() => setContacting(null)} />
          ) : (
            <>
              <Button label="Cancel" variant="secondary" size="sm" onClick={() => setContacting(null)} />
              <Button label="Send" icon={Send} size="sm" disabled={!message.trim()} onClick={sendMessage} />
            </>
          )
        }
      >
        {sent ? (
          <Text variant="bodySmall" color="text-success">
            Message sent to {contacting?.userId}.
          </Text>
        ) : (
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message to the user..."
          />
        )}
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Text variant="bodySmall" color="text-ink-secondary">
        {label}
      </Text>
      {value}
    </div>
  );
}
