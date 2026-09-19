import type { StatusTone } from '../utils/status';

export interface StatusPillProps {
  label: string;
  tone: StatusTone;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-surface-alt text-ink-secondary',
};

/**
 * Every status chip in the app (KYC verified/pending, user active/frozen,
 * dispute open/review, etc.) renders through this component. Map a new
 * status string to a tone in utils/status.ts, never hardcode colors at the
 * call site.
 */
export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
