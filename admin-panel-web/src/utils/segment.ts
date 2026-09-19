import type { UserSegment } from '../types/models';

const NEW_DAYS = 14;
const EXISTING_DAYS = 180;

/** Tenure tiers only — never used to change trade outcomes, just for list filtering. */
export function segmentForUser(joinedAt: string): UserSegment {
  const days = (Date.now() - new Date(joinedAt).getTime()) / 86_400_000;
  if (days <= NEW_DAYS) return 'new';
  if (days <= EXISTING_DAYS) return 'existing';
  return 'veteran';
}

export const SEGMENT_LABEL: Record<UserSegment, string> = {
  new: 'New',
  existing: 'Existing',
  veteran: 'Veteran',
};

export function formatJoinedAt(joinedAt: string): string {
  return new Date(joinedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
