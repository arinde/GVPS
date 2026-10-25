import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { Printer } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { formatKobo } from "@/lib/money";
import type { MyPayslip } from "@/store/api/payroll-api";

const helper = createColumnHelper<StockFeatures, MyPayslip>();

export function myPayslipColumns({ onPrint, printingId }: { onPrint: (row: MyPayslip) => void; printingId?: string }) {
  return [
    helper.accessor("label", {
      header: "Month",
      cell: ({ getValue }) => <span className="text-foreground font-medium">{getValue()}</span>,
    }),
    helper.accessor((row) => formatKobo(row.grossKobo), { id: "gross", header: "Gross" }),
    helper.accessor((row) => formatKobo(row.netKobo), {
      id: "net",
      header: "Net pay",
      cell: ({ getValue }) => <span className="font-semibold tabular-nums">{getValue()}</span>,
    }),
    helper.display({
      id: "print",
      header: "",
      cell: ({ row }) => (
        <AppButton
          type="button"
          variant="secondary"
          size="small"
          aria-label={`Print payslip for ${row.original.label}`}
          disabled={printingId === row.original.id}
          onClick={() => onPrint(row.original)}
        >
          <Printer aria-hidden="true" />
          {printingId === row.original.id ? "Loading…" : "Print"}
        </AppButton>
      ),
    }),
  ] as ColumnDef<StockFeatures, MyPayslip, unknown>[];
}
