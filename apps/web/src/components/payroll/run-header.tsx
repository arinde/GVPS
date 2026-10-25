import { ArrowLeft, Download, Printer } from "lucide-react";
import { AppButton, AppLinkButton } from "@/components/common/app-button";
import { PageHeader } from "@/components/common/page-header";
import { RunStatusPill } from "@/components/payroll/run-status-pill";
import { formatKobo } from "@/lib/money";
import type { PayrollRunSummary } from "@/store/api/payroll-api";

export type RunHeaderProps = {
  run: PayrollRunSummary;
  onPrintAll: () => void;
  /** Left out for anyone who may not see full account numbers, or a month not yet finalised. */
  onDownloadBankList?: () => void;
  downloadingBankList?: boolean;
};

/** A payroll month's title, status and totals, with the way back and the print and export buttons. Presentational. */
export function RunHeader({ run, onPrintAll, onDownloadBankList, downloadingBankList = false }: RunHeaderProps) {
  return (
    <PageHeader
      title={`Payroll — ${run.label}`}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-2">
          <RunStatusPill status={run.status} />
          {run.staffCount} staff · gross {formatKobo(run.grossKobo)} · deductions {formatKobo(run.deductionsKobo)} · net{" "}
          {formatKobo(run.netKobo)}
        </span>
      }
      actions={
        <>
          <AppLinkButton href="/payroll" variant="ghost">
            <ArrowLeft aria-hidden="true" />
            All months
          </AppLinkButton>
          <AppButton type="button" variant="secondary" disabled={run.staffCount === 0} onClick={onPrintAll}>
            <Printer aria-hidden="true" />
            Print all payslips
          </AppButton>
          {onDownloadBankList ? (
            <AppButton type="button" variant="secondary" disabled={downloadingBankList} onClick={onDownloadBankList}>
              <Download aria-hidden="true" />
              {downloadingBankList ? "Preparing…" : "Download bank list"}
            </AppButton>
          ) : null}
        </>
      }
    />
  );
}
