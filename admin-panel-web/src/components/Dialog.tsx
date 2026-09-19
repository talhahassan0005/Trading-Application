import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Text } from './Text';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * The only modal shell in the app — every dialog (confirmations, "view
 * case", "contact user", ...) renders through this. Overlay, sizing,
 * radius and close behavior live only here.
 */
export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-1 flex items-start justify-between gap-4">
          <Text variant="sectionTitle">{title}</Text>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {description ? (
          <Text variant="bodySmall" color="text-ink-secondary" className="mb-4">
            {description}
          </Text>
        ) : null}
        {children}
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
