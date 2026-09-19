import type { ButtonHTMLAttributes } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Every button in the app renders through this component. Height, radius,
 * and color per variant/size live only here — change them once, every
 * screen updates.
 */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-pressed',
  secondary: 'bg-surface-alt text-ink border border-border hover:bg-border',
  danger: 'bg-danger-bg text-danger hover:bg-danger hover:text-white',
  success: 'bg-success-bg text-success hover:bg-success hover:text-white',
  warning: 'bg-warning-bg text-warning hover:bg-warning hover:text-white',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-alt',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  fullWidth,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150',
        'hover:-translate-y-px hover:shadow-md active:translate-y-0 active:scale-[0.97] active:shadow-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100 cursor-pointer',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {Icon ? <Icon className="h-4 w-4" /> : null}
          {label}
        </>
      )}
    </button>
  );
}
