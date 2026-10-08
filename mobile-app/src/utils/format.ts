export const money = (v: number): string =>
  `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const signedMoney = (v: number): string => `${v > 0 ? '+' : ''}${money(v)}`;

export const percent = (v: number): string => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

/** 75 -> "1:15" */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
