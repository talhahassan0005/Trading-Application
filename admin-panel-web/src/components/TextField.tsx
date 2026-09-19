import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  secure?: boolean;
  leftIcon?: LucideIcon;
  error?: string;
}

/** Single input component for every text field in the app. */
export function TextField({ label, secure, leftIcon: Icon, error, ...rest }: TextFieldProps) {
  const [hidden, setHidden] = useState(!!secure);

  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-ink-secondary">
          {label}
        </span>
      ) : null}
      <span
        className={`flex h-11 items-center gap-2 rounded-lg border bg-surface px-3 ${
          error ? 'border-danger' : 'border-border focus-within:border-accent'
        }`}
      >
        {Icon ? <Icon className="h-4 w-4 text-ink-muted" /> : null}
        <input
          type={secure ? (hidden ? 'password' : 'text') : rest.type ?? 'text'}
          className="h-full flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          {...rest}
        />
        {secure ? (
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            className="text-ink-muted hover:text-ink-secondary cursor-pointer"
            tabIndex={-1}
          >
            {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        ) : null}
      </span>
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}
