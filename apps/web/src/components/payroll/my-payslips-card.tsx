"use client";

import { useState } from "react";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { myPayslipColumns } from "@/components/payroll/my-payslip-columns";
import { notify } from "@/lib/notify";
import { printPayslips } from "@/lib/print-payslip";
import { useLazyGetPayslipQuery, useListMyPayslipsQuery, type MyPayslip } from "@/store/api/payroll-api";

/** FEATURES.md §9.4 — the signed-in staff member's own payslips, once each month is finalised. */
export function MyPayslipsCard() {
  const { data: rows = [], isLoading } = useListMyPayslipsQuery();
  const [fetchPayslip] = useLazyGetPayslipQuery();
  const [printingId, setPrintingId] = useState<string>();

  async function print(row: MyPayslip) {
    setPrintingId(row.id);
    try {
      const payslip = await fetchPayslip(row.id, true).unwrap();
      printPayslips([payslip], `Payslip ${row.label}`);
    } catch (error) {
      notify.error(error, "Could not load this payslip.");
    } finally {
      setPrintingId(undefined);
    }
  }

  return (
    <ContentCard flush>
      <h2 className="px-5 pt-5 pb-3 text-base">My payslips</h2>
      <DataTable
        columns={myPayslipColumns({ onPrint: print, printingId })}
        data={rows}
        isLoading={isLoading}
        emptyTitle="No payslips yet"
        emptyDescription="Your payslip appears here once the school finalises a month's payroll."
      />
    </ContentCard>
  );
}
