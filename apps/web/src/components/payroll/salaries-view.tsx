"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { PayFormCard } from "@/components/payroll/pay-form-card";
import { salaryColumns } from "@/components/payroll/salary-columns";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { formatKobo } from "@/lib/money";
import { notify } from "@/lib/notify";
import { staffName } from "@/lib/staff-name";
import { useListSalariesQuery, useSaveSalaryMutation, type PayLines } from "@/store/api/payroll-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

/**
 * FEATURES.md §9.4 — each staff member's normal month: basic pay, allowances
 * and deductions. A payroll run copies from here; changing a salary never
 * touches a month already run.
 */
export function SalariesView() {
  const accessToken = useAppSelector(selectAccessToken);
  const canEdit = decodeAccessToken(accessToken ?? "")?.roles.includes("SUPERADMIN") ?? false;

  const { data: rows = [], isLoading } = useListSalariesQuery();
  const [saveSalary, saving] = useSaveSalaryMutation();
  const [editingStaffId, setEditingStaffId] = useState<string>();
  const editing = rows.find((row) => row.staff.id === editingStaffId);

  const withSalary = rows.filter((row) => row.salary);
  const monthlyNet = withSalary.reduce((sum, row) => sum + (row.salary?.netKobo ?? 0), 0);
  const missing = rows.length - withSalary.length;

  async function save(lines: PayLines) {
    if (!editing) return;
    const name = staffName(editing.staff);
    try {
      await saveSalary({ staffId: editing.staff.id, ...lines }).unwrap();
      notify.success(`Salary saved for ${name}`);
      setEditingStaffId(undefined);
    } catch (error) {
      return notify.error(error, `Could not save the salary for ${name}.`).fieldErrors;
    }
  }

  const columns = salaryColumns({
    canEdit,
    onEdit: (row) => {
      setEditingStaffId(row.staff.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Salaries"
        subtitle={
          isLoading
            ? undefined
            : `${withSalary.length} of ${rows.length} staff set · ${formatKobo(monthlyNet)} net per month` +
              (missing > 0 ? ` · ${missing} not set yet` : "")
        }
        actions={
          <AppLinkButton href="/payroll" variant="secondary">
            <ArrowLeft aria-hidden="true" />
            Back to payroll
          </AppLinkButton>
        }
      />

      <div className="flex flex-col gap-5">
        {editing ? (
          <PayFormCard
            key={editing.staff.id}
            title={`${editing.salary ? "Edit salary" : "Set salary"} — ${staffName(editing.staff)}`}
            note="Applies from the next payroll you create or refresh. Months already finalised keep what they paid."
            initial={editing.salary}
            submitLabel="Save salary"
            saving={saving.isLoading}
            onSubmit={save}
            onCancel={() => setEditingStaffId(undefined)}
          />
        ) : null}

        <ContentCard flush>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            emptyTitle="No staff yet"
            emptyDescription="Add staff under Staff first, then set their salaries here."
          />
        </ContentCard>
        {!canEdit ? <p className="text-muted-foreground text-xs">Only the superadmin can change salaries.</p> : null}
      </div>
    </PageContainer>
  );
}
