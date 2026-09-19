/**
 * "0123456789" -> "******6789". For the audit log: it must show that a salary
 * account changed and let someone recognise which one, without becoming a
 * second copy of the full number.
 */
export function maskAccountNumber(accountNumber: string | null | undefined): string | null {
  if (!accountNumber) return null;
  return `${"*".repeat(Math.max(accountNumber.length - 4, 0))}${accountNumber.slice(-4)}`;
}
