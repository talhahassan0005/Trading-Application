import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2 cursor-pointer"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150 group-hover:border-accent group-active:scale-90 ${
          checked ? 'border-accent bg-accent' : 'border-border-strong bg-transparent'
        }`}
      >
        {checked ? <Check className="h-3.5 w-3.5 text-white animate-pop-in" /> : null}
      </span>
      {label ? <span className="text-sm text-ink-secondary">{label}</span> : null}
    </button>
  );
}
