import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/**
 * Shared table primitives — every data table (Withdrawals, Users, Ledger)
 * uses these instead of raw <table>/<tr>/<td> so header styling, row
 * borders, and cell padding stay identical across the app.
 */
export function Table({ className = '', ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-left ${className}`} {...rest} />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TBody({ className = '', ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`stagger-rows ${className}`} {...rest} />;
}

export function TRow({ className = '', ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`border-b border-border last:border-0 transition-colors duration-150 hover:bg-surface-alt/60 ${className}`}
      {...rest}
    />
  );
}

export function TH({ className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium tracking-wide text-ink-secondary ${className}`}
      {...rest}
    />
  );
}

export function TD({ className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 text-sm text-ink align-middle ${className}`} {...rest} />;
}
