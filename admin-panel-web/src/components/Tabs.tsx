export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export interface TabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Single segmented-tab component used for any in-page filter (user segment, etc). */
export function Tabs<T extends string>({ options, value, onChange }: TabsProps<T>) {
  return (
    <div className="inline-flex gap-1 rounded-lg border border-border bg-surface-alt p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95 cursor-pointer ${
              active ? 'bg-card text-ink shadow-sm' : 'text-ink-secondary hover:text-ink'
            }`}
          >
            {opt.label}
            {opt.count != null ? <span className="text-ink-muted">{opt.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
