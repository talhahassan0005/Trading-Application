/** Deterministic 8-digit "account ID" from an email — purely cosmetic, no backend. */
export function accountId(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return String(10_000_000 + (h % 90_000_000));
}
