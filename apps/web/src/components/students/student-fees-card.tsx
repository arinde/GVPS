"use client";

import { useState } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "@/components/common/native-select";
import { StatusPill } from "@/components/common/status-pill";
import { TextInput } from "@/components/common/text-input";
import { formatKobo, parseNairaToKobo } from "@/lib/money";
import { notify } from "@/lib/notify";
import { printReceipt } from "@/lib/print-receipt";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import {
  useGetStudentLedgerQuery,
  useRecordPaymentMutation,
  useReversePaymentMutation,
  type Invoice,
  type Payment,
  type PaymentMethod,
} from "@/store/api/fees-api";

export type StudentFeesCardProps = { studentId: string; studentName: string; canRecordPayment: boolean };

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "POS", label: "POS" },
];

/**
 * FEATURES.md §6.3-§6.5 — a student's invoices, payments and running
 * balance. Recording or reversing a payment is bursar-only (FEATURES.md
 * §14: even superadmin is read-only here) — `canRecordPayment` hides the
 * form rather than show it and let the API's 403 be the only feedback.
 */
export function StudentFeesCard({ studentId, studentName, canRecordPayment }: StudentFeesCardProps) {
  const { data: ledger, isLoading } = useGetStudentLedgerQuery(studentId);
  const { data: access } = useGetMyAccessQuery();
  const schoolName = access?.school.name ?? "";
  const latest = ledger?.invoices.at(-1);

  if (isLoading) {
    return (
      <ContentCard>
        <p className="text-muted-foreground text-sm" role="status">
          Loading fees…
        </p>
      </ContentCard>
    );
  }

  if (!latest) {
    return (
      <ContentCard>
        <h2 className="mb-3 text-base">Fees</h2>
        <EmptyState title="No invoice yet" description="An invoice for this student hasn't been generated this term." />
      </ContentCard>
    );
  }

  return (
    <ContentCard>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base">Fees</h2>
        <StatusPill
          tone={latest.balance.balance > 0 ? "warning" : "success"}
          shape={latest.balance.balance > 0 ? "diamond" : "circle"}
        >
          {latest.balance.balance > 0 ? `Owes ${formatKobo(latest.balance.balance)}` : "Fully paid"}
        </StatusPill>
      </div>

      <ul className="mb-4 flex flex-col gap-1 text-sm">
        {latest.lineItems.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>{item.name}</span>
            <span>{formatKobo(item.amountKobo)}</span>
          </li>
        ))}
        {latest.openingBalanceKobo > 0 ? (
          <li className="text-muted-foreground flex justify-between">
            <span>Carried forward</span>
            <span>{formatKobo(latest.openingBalanceKobo)}</span>
          </li>
        ) : null}
      </ul>

      {latest.payments.length > 0 ? (
        <PaymentsList
          invoice={latest}
          canReverse={canRecordPayment}
          schoolName={schoolName}
          studentName={studentName}
        />
      ) : null}

      {canRecordPayment && latest.balance.balance > 0 ? <RecordPaymentForm invoiceId={latest.id} /> : null}
    </ContentCard>
  );
}

type PaymentsListProps = { invoice: Invoice; canReverse: boolean; schoolName: string; studentName: string };

function PaymentsList({ invoice, canReverse, schoolName, studentName }: PaymentsListProps) {
  const [reversePayment, reversing] = useReversePaymentMutation();
  const [reversingPaymentId, setReversingPaymentId] = useState<string>();
  const [reversalReason, setReversalReason] = useState("");

  function print(payment: Payment) {
    printReceipt({
      schoolName,
      studentName,
      receiptNumber: payment.receiptNumber,
      amountKobo: payment.amountKobo,
      method: payment.method,
      reference: payment.reference,
      payerName: payment.payerName,
      receivedByName: payment.receivedByName,
      createdAt: payment.createdAt,
    });
  }

  async function confirmReverse(paymentId: string, receiptNumber: string) {
    const reason = reversalReason.trim();
    if (!reason) {
      notify.warning("Enter a reason for the reversal.");
      return;
    }
    try {
      await reversePayment({ paymentId, reason }).unwrap();
      notify.success(`Receipt ${receiptNumber} reversed`);
      setReversingPaymentId(undefined);
      setReversalReason("");
    } catch (error) {
      notify.error(error, "Could not reverse this payment.");
    }
  }

  return (
    <div className="mb-4">
      <h3 className="text-muted-foreground mb-2 text-xs font-medium">Payments</h3>
      <ul className="flex flex-col gap-2 text-sm">
        {invoice.payments.map((payment) => (
          <li key={payment.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={payment.reversedAt ? "text-muted-foreground line-through" : undefined}>
                {payment.receiptNumber} — {formatKobo(payment.amountKobo)}
              </span>
              <div className="flex items-center gap-2">
                <AppButton type="button" variant="secondary" size="small" onClick={() => print(payment)}>
                  Print
                </AppButton>
                {canReverse && !payment.reversedAt && reversingPaymentId !== payment.id ? (
                  <AppButton
                    type="button"
                    variant="danger"
                    size="small"
                    onClick={() => {
                      setReversingPaymentId(payment.id);
                      setReversalReason("");
                    }}
                  >
                    Reverse
                  </AppButton>
                ) : null}
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Paid by {payment.payerName} · received by {payment.receivedByName}
            </p>
            {reversingPaymentId === payment.id ? (
              <div className="flex flex-wrap items-center gap-2">
                <TextInput
                  aria-label={`Reason for reversing receipt ${payment.receiptNumber}`}
                  placeholder="Reason for reversal"
                  value={reversalReason}
                  onChange={(event) => setReversalReason(event.target.value)}
                  className="w-48"
                />
                <AppButton
                  type="button"
                  size="small"
                  variant="danger"
                  disabled={reversing.isLoading}
                  onClick={() => confirmReverse(payment.id, payment.receiptNumber)}
                >
                  {reversing.isLoading ? "Reversing…" : "Confirm reversal"}
                </AppButton>
                <AppButton type="button" size="small" variant="ghost" onClick={() => setReversingPaymentId(undefined)}>
                  Cancel
                </AppButton>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [amountText, setAmountText] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [payerName, setPayerName] = useState("");
  const [receivedByName, setReceivedByName] = useState("");
  const [recordPayment, recording] = useRecordPaymentMutation();

  async function submit() {
    const amountKobo = parseNairaToKobo(amountText);
    if (amountKobo === null || amountKobo <= 0) {
      notify.warning("Enter a valid amount greater than zero.");
      return;
    }
    if (!payerName.trim() || !receivedByName.trim()) {
      notify.warning("Enter who paid and who received it, for the audit trail.");
      return;
    }

    try {
      const payment = await recordPayment({
        invoiceId,
        amountKobo,
        method,
        reference: reference.trim() || undefined,
        payerName: payerName.trim(),
        receivedByName: receivedByName.trim(),
      }).unwrap();
      notify.success(`Payment recorded — receipt ${payment.receiptNumber}`, { durationMs: 8_000 });
      setAmountText("");
      setReference("");
      setPayerName("");
      // Left as-is: the same person usually receives several payments in a
      // row (AGENTS.md §12 — don't make people repeat themselves).
    } catch (error) {
      notify.error(error, "Could not record this payment.");
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <h3 className="text-muted-foreground text-xs font-medium">Record a payment</h3>
      <div className="flex flex-wrap gap-2">
        <TextInput
          aria-label="Amount in naira"
          placeholder="Amount (₦)"
          inputMode="decimal"
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
          className="w-32"
        />
        <NativeSelect
          aria-label="Payment method"
          value={method}
          onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          options={METHODS}
          className="w-32"
        />
        <TextInput
          aria-label="Reference (optional)"
          placeholder="Reference (optional)"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className="w-40"
        />
        <TextInput
          aria-label="Name of the person paying"
          placeholder="Paid by (name)"
          value={payerName}
          onChange={(event) => setPayerName(event.target.value)}
          className="w-40"
        />
        <TextInput
          aria-label="Name of the staff member receiving the payment"
          placeholder="Received by (name)"
          value={receivedByName}
          onChange={(event) => setReceivedByName(event.target.value)}
          className="w-40"
        />
        <AppButton type="button" size="small" onClick={submit} disabled={recording.isLoading}>
          {recording.isLoading ? "Recording…" : "Record payment"}
        </AppButton>
      </div>
      <p className="text-muted-foreground text-xs">
        Both names are kept on the receipt and the payment record, for audit.
      </p>
    </div>
  );
}
