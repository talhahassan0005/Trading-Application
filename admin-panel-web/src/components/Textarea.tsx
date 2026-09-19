import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

/** Single multi-line input component — mirrors TextField's border/focus styling. */
export function Textarea({ label, className = '', rows = 4, ...rest }: TextareaProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-ink-secondary">
          {label}
        </span>
      ) : null}
      <textarea
        rows={rows}
        className={`w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent ${className}`}
        {...rest}
      />
    </label>
  );
}
