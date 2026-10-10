"use client";

import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { StatusPill } from "@/components/common/status-pill";
import { LoadingState } from "@/components/common/spinner";
import { formatDate } from "@/lib/dates";
import { formatKobo } from "@/lib/money";
import { useGetPortalChildFeesQuery } from "@/store/api/portal-api";

export type PortalChildFeesCardProps = { studentId: string };

/** FEATURES.md §12: a parent's read-only fee statement for their ward — no action ever writes from here. */
export function PortalChildFeesCard({ studentId }: PortalChildFeesCardProps) {
  const { data: ledger, isLoading } = useGetPortalChildFeesQuery(studentId);
  const latest = ledger?.invoices.at(-1);

  if (isLoading) {
    return (
      <ContentCard>
        <LoadingState label="Loading fees…" />
      </ContentCard>
    );
  }

  if (!latest) {
    return (
      <ContentCard>
        <h2 className="mb-3 text-base">Fees</h2>
        <EmptyState title="No invoice yet" description="An invoice for this term hasn't been generated yet." />
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
        <div>
          <h3 className="text-muted-foreground mb-2 text-xs font-medium">Payments</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {latest.payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between">
                <span className={payment.reversedAt ? "text-muted-foreground line-through" : undefined}>
                  {payment.receiptNumber} — {formatKobo(payment.amountKobo)}
                </span>
                <span className="text-muted-foreground text-xs">{formatDate(payment.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ContentCard>
  );
}
