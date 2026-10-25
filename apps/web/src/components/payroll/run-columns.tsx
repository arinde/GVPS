import Link from "next/link";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { RunStatusPill } from "@/components/payroll/run-status-pill";
import { formatKobo } from "@/lib/money";
import type { PayrollRunSummary } from "@/store/api/payroll-api";

const helper = createColumnHelper<StockFeatures, PayrollRunSummary>();

export const runColumns = [
  helper.display({
    id: "month",
    header: "Month",
    cell: ({ row }) => (
      <Link href={`/payroll/${row.original.id}`} className="text-foreground font-medium hover:underline">
        {row.original.label}
      </Link>
    ),
  }),
  helper.display({ id: "status", header: "Status", cell: ({ row }) => <RunStatusPill status={row.original.status} /> }),
  helper.accessor("staffCount", { header: "Staff" }),
  helper.accessor((run) => formatKobo(run.grossKobo), { id: "gross", header: "Gross" }),
  helper.accessor((run) => formatKobo(run.deductionsKobo), { id: "deductions", header: "Deductions" }),
  helper.accessor((run) => formatKobo(run.netKobo), {
    id: "net",
    header: "Net pay",
    cell: ({ getValue }) => <span className="font-semibold tabular-nums">{getValue()}</span>,
  }),
] as ColumnDef<StockFeatures, PayrollRunSummary, unknown>[];
