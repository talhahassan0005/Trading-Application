export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Central map from every raw status string used in mock data / API
 * responses to a visual tone. Add new statuses here only — pages must
 * never decide colors themselves.
 */
const STATUS_TONE_MAP: Record<string, StatusTone> = {
  verified: 'success',
  active: 'success',
  approved: 'success',
  resolved: 'success',
  pass: 'success',
  valid: 'success',
  profit: 'success',

  pending: 'warning',
  review: 'warning',
  manual: 'warning',
  'needs review': 'warning',
  moderate: 'warning',

  frozen: 'danger',
  rejected: 'danger',
  open: 'danger',
  fail: 'danger',
  loss: 'danger',

  submitted: 'info',
  processing: 'info',
};

export function toneForStatus(status: string): StatusTone {
  return STATUS_TONE_MAP[status.toLowerCase()] ?? 'neutral';
}
