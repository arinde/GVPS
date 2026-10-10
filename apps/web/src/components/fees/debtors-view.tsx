"use client";

import { useState } from "react";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { AppButton, AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { formatKobo } from "@/lib/money";
import { notify } from "@/lib/notify";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import { useGenerateInvoicesMutation, useListDebtorsQuery, type Debtor } from "@/store/api/fees-api";

const helper = createColumnHelper<StockFeatures, Debtor>();
const columns = [
  helper.accessor("studentName", { header: "Student" }),
  helper.accessor("admissionNo", { header: "Admission no." }),
  helper.accessor((row) => row.className ?? "—", { id: "class", header: "Class" }),
  helper.accessor((row) => formatKobo(row.balanceKobo), { id: "balance", header: "Balance owed" }),
  helper.display({
    id: "breakdown",
    header: "",
    cell: ({ row }) => (
      <AppLinkButton href={`/students/${row.original.studentId}`} variant="secondary" size="small">
        View breakdown
      </AppLinkButton>
    ),
  }),
] as ColumnDef<StockFeatures, Debtor, unknown>[];

/**
 * FEATURES.md §6.5 — the debtor list, and the one write action that belongs
 * alongside it: generating this term's invoices for a class. Recording an
 * individual payment happens from the student's own profile instead.
 */
export function DebtorsView() {
  const { data: period } = useGetCurrentPeriodQuery();
  const termId = period?.term?.id;
  const { data: arms = [] } = useListClassArmsQuery();
  const { data: debtors = [], isLoading } = useListDebtorsQuery();

  const [classArmId, setClassArmId] = useState("");
  const [generate, generating] = useGenerateInvoicesMutation();

  async function generateInvoices() {
    if (!termId || !classArmId) return;
    const arm = arms.find((candidate) => candidate.id === classArmId);
    const label = arm ? `${arm.classLevel.name}${arm.name}` : "this class";
    try {
      const result = await generate({ termId, classArmId }).unwrap();
      notify.success(`Invoices generated for ${label}`, {
        description: `${result.created} created, ${result.skipped} already had one.`,
      });
    } catch (error) {
      notify.error(error, `Could not generate invoices for ${label}.`);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Fees"
        subtitle={period?.term?.name}
        actions={
          <AppLinkButton href="/fees/structure" variant="secondary">
            Fee structure
          </AppLinkButton>
        }
      />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <h2 className="mb-4 text-base">Generate this term&apos;s invoices</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <NativeSelect
              aria-label="Class"
              placeholder="Choose a class…"
              value={classArmId}
              onChange={(event) => setClassArmId(event.target.value)}
              options={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
              className="max-w-xs"
            />
            <AppButton
              type="button"
              onClick={generateInvoices}
              disabled={generating.isLoading || !classArmId || !termId}
            >
              {generating.isLoading ? "Generating…" : "Generate invoices"}
            </AppButton>
          </div>
          {/* STITCH-GLOBAL.md §13: a disabled button must say why, visibly, not just dim. */}
          {!classArmId && !generating.isLoading ? (
            <p className="text-muted-foreground mt-2 text-xs">Choose a class above to enable this.</p>
          ) : null}
          <p className="text-muted-foreground mt-2 text-xs">
            Only compulsory fee items are billed automatically; optional ones are added from a student&apos;s own fees
            record. Students who already have an invoice this term are skipped.
          </p>
        </ContentCard>

        <ContentCard flush>
          <h2 className="px-5 pt-5 pb-3 text-base">Debtors</h2>
          <DataTable
            columns={columns}
            data={debtors}
            isLoading={isLoading}
            emptyTitle="No outstanding balances"
            emptyDescription="Every generated invoice has been paid in full."
          />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
