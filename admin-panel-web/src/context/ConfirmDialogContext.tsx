import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Dialog } from '../components/Dialog';
import { Button, type ButtonVariant } from '../components/Button';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'success' | 'primary';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFn | undefined>(undefined);

const TONE_VARIANT: Record<NonNullable<ConfirmOptions['tone']>, ButtonVariant> = {
  danger: 'danger',
  success: 'success',
  primary: 'primary',
};

/**
 * App-wide confirmation dialog. Call `useConfirm()` from any page to await
 * a yes/no answer before an irreversible action (approve/reject, freeze
 * account, resolve dispute, ...) — one dialog instance, rendered once here,
 * instead of every page managing its own modal state.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(undefined);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    setOptions(null);
  };

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      <Dialog
        open={options != null}
        onClose={() => settle(false)}
        title={options?.title ?? ''}
        description={options?.description}
        footer={
          <>
            <Button
              label={options?.cancelLabel ?? 'Cancel'}
              variant="secondary"
              size="sm"
              onClick={() => settle(false)}
            />
            <Button
              label={options?.confirmLabel ?? 'Confirm'}
              variant={TONE_VARIANT[options?.tone ?? 'primary']}
              size="sm"
              onClick={() => settle(true)}
            />
          </>
        }
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  return ctx;
}
