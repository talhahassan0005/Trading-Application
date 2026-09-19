import type { ElementType, HTMLAttributes } from 'react';

export type TextVariant =
  | 'display'
  | 'displaySm'
  | 'title'
  | 'sectionTitle'
  | 'body'
  | 'bodyMedium'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'mono';

/**
 * Single source of truth for every font size/weight in the app. Change a
 * variant's classes here and every <Text variant="..."> updates — screens
 * must never set text-* / font-* classes ad-hoc, add a new variant instead.
 */
const VARIANT_CLASSES: Record<TextVariant, string> = {
  display: 'text-[32px] leading-[38px] font-bold',
  displaySm: 'text-2xl leading-8 font-bold',
  title: 'text-xl leading-7 font-bold',
  sectionTitle: 'text-base leading-6 font-semibold',
  body: 'text-sm leading-5 font-normal',
  bodyMedium: 'text-sm leading-5 font-medium',
  bodySmall: 'text-[13px] leading-[18px] font-normal',
  label: 'text-xs leading-4 font-medium tracking-wide',
  caption: 'text-[11px] leading-[15px] font-normal',
  mono: 'text-[13px] leading-[18px] font-medium font-mono',
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  as?: ElementType;
  color?: string;
}

export function Text({ variant = 'body', as: As = 'p', color, className = '', ...rest }: TextProps) {
  return (
    <As
      className={`${VARIANT_CLASSES[variant]} ${color ?? 'text-ink'} ${className}`}
      {...rest}
    />
  );
}
