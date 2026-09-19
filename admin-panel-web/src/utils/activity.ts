import type { ActivityType } from '../types/models';

/** Maps each activity feed event type to its indicator dot color class. */
export function dotColorForActivity(type: ActivityType): string {
  switch (type) {
    case 'withdrawal':
      return 'bg-warning';
    case 'deposit':
      return 'bg-success';
    case 'kyc':
      return 'bg-info';
    case 'dispute':
      return 'bg-danger';
    case 'trade':
    default:
      return 'bg-ink-muted';
  }
}
