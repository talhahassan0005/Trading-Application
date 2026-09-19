import { Card } from './Card';
import { Text } from './Text';

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  hintTone?: 'success' | 'warning' | 'danger' | 'neutral';
}

const HINT_CLASSES: Record<NonNullable<StatCardProps['hintTone']>, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-ink-muted',
};

/** Dashboard metric tile — same shape used for every stat on Overview. */
export function StatCard({ label, value, hint, hintTone = 'neutral' }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-[180px] transition-all duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_10px_28px_rgb(var(--shadow-color)/0.14)]">
      <Text variant="label" color="text-ink-secondary">
        {label}
      </Text>
      <Text variant="displaySm" className="mt-1.5">
        {value}
      </Text>
      {hint ? (
        <Text variant="bodySmall" color={HINT_CLASSES[hintTone]} className="mt-1">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}
