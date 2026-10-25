import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { Pencil, Printer } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { formatKobo } from "@/lib/money";
import type { Payslip } from "@/store/api/payroll-api";

export type PayslipColumnsOptions = {
  /** Draft runs only, and only for the superadmin. */
  canAdjust: boolean;
  onAdjust: (payslip: Payslip) => void;
  onPrint: (payslip: Payslip) => void;
};

const helper = createColumnHelper<StockFeatures, Payslip>();

export function payslipColumns({ canAdjust, onAdjust, onPrint }: PayslipColumnsOptions) {
  return [
    helper.accessor((slip) => slip.staff.name, {
      id: "name",
      header: "Staff member",
      cell: ({ getValue }) => <span className="text-foreground font-medium">{getValue()}</span>,
    }),
    helper.accessor((slip) => slip.staff.bankName ?? "No account on record", { id: "bank", header: "Bank" }),
    helper.accessor((slip) => formatKobo(slip.grossKobo), { id: "gross", header: "Gross" }),
    helper.accessor((slip) => formatKobo(slip.deductionsKobo), { id: "deductions", header: "Deductions" }),
    helper.accessor((slip) => formatKobo(slip.netKobo), {
      id: "net",
      header: "Net pay",
      cell: ({ getValue }) => <span className="font-semibold tabular-nums">{getValue()}</span>,
    }),
    helper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {canAdjust ? (
            <AppButton
              type="button"
              variant="secondary"
              size="small"
              aria-label={`Adjust payslip for ${row.original.staff.name}`}
              onClick={() => onAdjust(row.original)}
            >
              <Pencil aria-hidden="true" />
              Adjust
            </AppButton>
          ) : null}
          <AppButton
            type="button"
            variant="secondary"
            size="small"
            aria-label={`Print payslip for ${row.original.staff.name}`}
            onClick={() => onPrint(row.original)}
          >
            <Printer aria-hidden="true" />
            Print
          </AppButton>
        </div>
      ),
    }),
  ] as ColumnDef<StockFeatures, Payslip, unknown>[];
}
