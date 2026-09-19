export type AvatarSize = 'sm' | 'md' | 'xl';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
}

/**
 * Fixed size scale (never a raw pixel prop) so every avatar in the app is
 * one of exactly three sizes, all defined here — no inline styles, no
 * arbitrary numbers scattered across pages.
 */
const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  xl: 'h-16 w-16 text-xl',
};

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Circular initials avatar used for admin users and end users alike. */
export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-alt font-medium text-ink-secondary ${SIZE_CLASSES[size]}`}
    >
      {initialsFor(name)}
    </div>
  );
}
