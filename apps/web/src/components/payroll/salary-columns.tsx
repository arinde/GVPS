import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { primaryRoleLabel } from "@/components/auth/roles";
import { AppButton } from "@/components/common/app-button";
import { StatusPill } from "@/components/common/status-pill";
import { formatKobo } from "@/lib/money";
import { staffName } from "@/lib/staff-name";
import type { SalaryRow } from "@/store/api/payroll-api";

export type SalaryColumnsOptions = {
  /** Only the superadmin sets salaries (FEATURES.md §14); everyone else reads. */
  canEdit: boolean;
  onEdit: (row: SalaryRow) => void;
};

const helper = createColumnHelper<StockFeatures, SalaryRow>();

function money(kobo: number | undefined) {
  return kobo === undefined ? "—" : <span className="tabular-nums">{formatKobo(kobo)}</span>;
}

export function salaryColumns({ canEdit, onEdit }: SalaryColumnsOptions) {
  const columns = [
    helper.accessor((row) => staffName(row.staff), {
      id: "name",
      header: "Staff member",
      cell: ({ getValue }) => <span className="text-foreground font-medium">{getValue()}</span>,
    }),
    helper.accessor((row) => primaryRoleLabel(row.staff.roles.map(({ role }) => role)), { id: "role", header: "Role" }),
    helper.display({ id: "basic", header: "Basic", cell: ({ row }) => money(row.original.salary?.basicKobo) }),
    helper.display({ id: "gross", header: "Gross", cell: ({ row }) => money(row.original.salary?.grossKobo) }),
    helper.display({
      id: "deductions",
      header: "Deductions",
      cell: ({ row }) => money(row.original.salary?.deductionsKobo),
    }),
    helper.display({
      id: "net",
      header: "Net pay",
      cell: ({ row }) =>
        row.original.salary ? (
          <span className="font-semibold tabular-nums">{formatKobo(row.original.salary.netKobo)}</span>
        ) : (
          <StatusPill tone="warning" shape="diamond">
            Not set
          </StatusPill>
        ),
    }),
  ];

  if (canEdit) {
    columns.push(
      helper.display({
        id: "edit",
        header: "",
        cell: ({ row }) => (
          <AppButton
            type="button"
            variant="secondary"
            size="small"
            aria-label={`${row.original.salary ? "Edit" : "Set"} salary for ${staffName(row.original.staff)}`}
            onClick={() => onEdit(row.original)}
          >
            <Pencil aria-hidden="true" />
            {row.original.salary ? "Edit" : "Set salary"}
          </AppButton>
        ),
      }),
    );
  }

  return columns as ColumnDef<StockFeatures, SalaryRow, unknown>[];
}
