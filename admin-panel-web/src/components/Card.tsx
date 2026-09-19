import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

/** Standard container used for every panel/card across the app. */
export function Card({ padded = true, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card ${padded ? 'p-5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
