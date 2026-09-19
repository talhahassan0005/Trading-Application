import { Text } from './Text';

export interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
}

/** On/off toggle used across Settings — the single place switch styling lives. */
export function Switch({ checked, onChange, label, description }: SwitchProps) {
  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`group relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${
        checked ? 'bg-accent' : 'bg-surface-alt border border-border-strong'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-active:w-6 ${
          checked ? 'translate-x-5 group-active:translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );

  if (!label) return toggle;

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Text variant="bodyMedium">{label}</Text>
        {description ? (
          <Text variant="caption" color="text-ink-muted" className="mt-0.5">
            {description}
          </Text>
        ) : null}
      </div>
      {toggle}
    </div>
  );
}
