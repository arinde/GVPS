"use client";

import { useState } from "react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { LoadingState } from "@/components/common/spinner";
import { PayFormCard } from "@/components/payroll/pay-form-card";
import { payslipColumns } from "@/components/payroll/payslip-columns";
import { RunDraftActions } from "@/components/payroll/run-draft-actions";
import { RunHeader } from "@/components/payroll/run-header";
import { useBankListDownload } from "@/components/payroll/use-bank-list-download";
import { useDraftRunActions } from "@/components/payroll/use-draft-run-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { printPayslips } from "@/lib/print-payslip";
import {
  useGetPayrollRunQuery,
  useUpdatePayslipMutation,
  type PayLines,
  type Payslip,
  type PayrollRun,
} from "@/store/api/payroll-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

function printable(run: PayrollRun, payslip: Payslip) {
  return { ...payslip, school: run.school, label: run.label, status: run.status, finalisedAt: run.finalisedAt };
}

/** One month's payroll: every payslip, the totals, and — while a draft — adjust, refresh, finalise or delete. */
export function PayrollRunView({ runId }: { runId: string }) {
  const accessToken = useAppSelector(selectAccessToken);
  const isSuperadmin = decodeAccessToken(accessToken ?? "")?.roles.includes("SUPERADMIN") ?? false;

  const { data: run, isLoading, isError } = useGetPayrollRunQuery(runId);
  const draftActions = useDraftRunActions({ id: runId, label: run?.label ?? "" });
  const bankList = useBankListDownload(runId);
  const [updatePayslip, updating] = useUpdatePayslipMutation();
  const [adjustingId, setAdjustingId] = useState<string>();

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState label="Loading payroll…" />
      </PageContainer>
    );
  }
  if (isError || !run) {
    return (
      <PageContainer>
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            This payroll could not be found. It may have been a draft that was deleted.
          </AlertDescription>
        </Alert>
        <AppLinkButton href="/payroll" variant="secondary" className="mt-4">
          Back to payroll
        </AppLinkButton>
      </PageContainer>
    );
  }

  const isDraft = run.status === "DRAFT";
  const canChange = isDraft && isSuperadmin;
  const payslips = [...run.payslips].sort((a, b) => a.staff.name.localeCompare(b.staff.name));
  const adjusting = canChange ? payslips.find((slip) => slip.id === adjustingId) : undefined;

  async function saveAdjustment(lines: PayLines) {
    if (!adjusting) return;
    try {
      await updatePayslip({ payslipId: adjusting.id, ...lines }).unwrap();
      notify.success(`Payslip adjusted for ${adjusting.staff.name}`);
      setAdjustingId(undefined);
    } catch (error) {
      return notify.error(error, "Could not save this payslip.").fieldErrors;
    }
  }

  const columns = payslipColumns({
    canAdjust: canChange,
    onAdjust: (slip) => {
      setAdjustingId(slip.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onPrint: (slip) => printPayslips([printable(run, slip)], `Payslip ${slip.staff.name} ${run.label}`),
  });

  return (
    <PageContainer>
      <RunHeader
        run={run}
        // Full account numbers: the superadmin's alone, and only once the month is final.
        onDownloadBankList={isSuperadmin && !isDraft ? bankList.download : undefined}
        downloadingBankList={bankList.downloading}
        onPrintAll={() =>
          printPayslips(
            payslips.map((slip) => printable(run, slip)),
            `Payslips ${run.label}`,
          )
        }
      />

      <div className="flex flex-col gap-5">
        {canChange && !adjusting ? <RunDraftActions label={run.label} {...draftActions} /> : null}

        {adjusting ? (
          <PayFormCard
            key={adjusting.id}
            title={`Adjust payslip — ${adjusting.staff.name}`}
            note={`For ${run.label} only. Their salary is unchanged; refreshing this draft would undo the adjustment.`}
            initial={adjusting}
            submitLabel="Save payslip"
            saving={updating.isLoading}
            onSubmit={saveAdjustment}
            onCancel={() => setAdjustingId(undefined)}
          />
        ) : null}

        <ContentCard flush>
          <DataTable columns={columns} data={payslips} emptyTitle="No payslips in this payroll" />
        </ContentCard>

        {isDraft && !isSuperadmin ? (
          <p className="text-muted-foreground text-xs">
            This payroll is still a draft. Only the superadmin can change it.
          </p>
        ) : null}
      </div>
    </PageContainer>
  );
}
