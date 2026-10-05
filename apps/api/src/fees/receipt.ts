/** FEATURES.md §6.4 — the full receipt as it was issued. Frozen on the payment, never recomputed. */
export type ReceiptSnapshot = {
  school: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    taxNumber: string | null;
  };
  receiptNumber: string;
  issuedAt: string;
  student: { name: string; admissionNo: string; classLabel: string | null };
  session: string;
  term: string;
  items: { name: string; amountKobo: number }[];
  openingBalanceKobo: number;
  totalDueKobo: number;
  paidBeforeKobo: number;
  payment: {
    amountKobo: number;
    method: string;
    reference: string | null;
    payerName: string;
    receivedByName: string;
    recordedByName: string;
  };
  balanceBeforeKobo: number;
  balanceAfterKobo: number;
  vat: { rateBps: number; vatKobo: number; netKobo: number };
};

export type ReceiptInput = Omit<ReceiptSnapshot, "totalDueKobo" | "balanceBeforeKobo" | "balanceAfterKobo" | "vat"> & {
  vatRateBps: number;
};

/**
 * Totals, balances and VAT in one place. VAT is taken out of the amount paid
 * (the fees already include it), so the balance is never changed by it.
 */
export function buildReceipt(input: ReceiptInput): ReceiptSnapshot {
  const { vatRateBps, ...rest } = input;
  const billed = input.items.reduce((sum, item) => sum + item.amountKobo, 0);
  const totalDueKobo = input.openingBalanceKobo + billed;
  const balanceBeforeKobo = totalDueKobo - input.paidBeforeKobo;
  const amount = input.payment.amountKobo;
  const vatKobo = vatRateBps > 0 ? Math.round((amount * vatRateBps) / (10000 + vatRateBps)) : 0;

  return {
    ...rest,
    totalDueKobo,
    balanceBeforeKobo,
    balanceAfterKobo: balanceBeforeKobo - amount,
    vat: { rateBps: vatRateBps, vatKobo, netKobo: amount - vatKobo },
  };
}
