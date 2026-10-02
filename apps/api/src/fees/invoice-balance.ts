import type { InvoiceLineItem, Payment } from "@prisma/client";

export type InvoiceBalance = { totalDue: number; totalPaid: number; balance: number };

/**
 * One formula, used everywhere an invoice's balance is shown (the ledger,
 * the debtor list) — money math duplicated in two places is exactly the kind
 * of thing that quietly drifts apart (PLAN.md §1: correctness beats features).
 */
export function computeInvoiceBalance(invoice: {
  openingBalanceKobo: number;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
}): InvoiceBalance {
  const billed = invoice.lineItems.reduce((sum, item) => sum + item.amountKobo, 0);
  const totalDue = invoice.openingBalanceKobo + billed;
  const totalPaid = invoice.payments
    .filter((payment) => !payment.reversedAt)
    .reduce((sum, payment) => sum + payment.amountKobo, 0);
  return { totalDue, totalPaid, balance: totalDue - totalPaid };
}
