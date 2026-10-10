"use client";

import { useState } from "react";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StatusPill } from "@/components/common/status-pill";
import { formatDate } from "@/lib/dates";
import { useListEmailTrailQuery, type EmailTrailItem, type EmailTrailStatus } from "@/store/api/audit-api";

const PAGE_SIZE = 25;

const STATUS: Record<EmailTrailStatus, { label: string; tone: "success" | "danger" | "warning" }> = {
  sent: { label: "Sent", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  skipped: { label: "Not sent", tone: "warning" },
};

const helper = createColumnHelper<StockFeatures, EmailTrailItem>();
const columns = [
  helper.accessor("createdAt", {
    header: "When",
    cell: (info) => formatDate(info.getValue()),
  }),
  helper.accessor("recipient", { header: "To" }),
  helper.accessor("subject", { header: "Subject" }),
  helper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const { status, reason } = row.original;
      return (
        <div className="flex flex-col gap-1">
          <StatusPill tone={STATUS[status].tone} shape={status === "sent" ? "circle" : "diamond"}>
            {STATUS[status].label}
          </StatusPill>
          {reason ? <span className="text-muted-foreground text-xs">{reason}</span> : null}
        </div>
      );
    },
  }),
  helper.accessor("relatedTo", { header: "Related to" }),
  helper.accessor((row) => row.sentBy ?? "—", { id: "sentBy", header: "Sent by" }),
] as ColumnDef<StockFeatures, EmailTrailItem, unknown>[];

/**
 * FEATURES.md §11.5 — every email the system has sent, failed or skipped.
 * Paged on the server; the page number is local view state, not server data.
 */
export function EmailTrailView() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useListEmailTrailQuery({ page, pageSize: PAGE_SIZE });
  const items = data?.items ?? [];
  const lastPage = data ? Math.max(0, Math.ceil(data.total / PAGE_SIZE) - 1) : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Email trail"
        subtitle={data ? `${data.total} email${data.total === 1 ? "" : "s"}` : undefined}
      />
      <ContentCard flush>
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyTitle="No emails yet"
          emptyDescription="Registrations, receipts and portal logins that send an email will appear here."
        />
        <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {lastPage + 1}
          </span>
          <div className="flex gap-2">
            <AppButton
              type="button"
              variant="secondary"
              size="small"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              size="small"
              disabled={page >= lastPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </AppButton>
          </div>
        </div>
      </ContentCard>
    </PageContainer>
  );
}
