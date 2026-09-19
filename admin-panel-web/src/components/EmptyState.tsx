import { Inbox, type LucideIcon } from 'lucide-react';
import { Text } from './Text';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-16 px-6 text-center">
      <Icon className="h-8 w-8 text-ink-muted" />
      <Text variant="sectionTitle" className="mt-3">
        {title}
      </Text>
      {description ? (
        <Text variant="bodySmall" color="text-ink-secondary" className="mt-1">
          {description}
        </Text>
      ) : null}
    </div>
  );
}
