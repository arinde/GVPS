"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote } from "lucide-react";
import { AppButton, AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { runColumns } from "@/components/payroll/run-columns";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { useCreatePayrollRunMutation, useListPayrollRunsQuery } from "@/store/api/payroll-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Date(Date.UTC(2000, index, 1)).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }),
}));

/**
 * FEATURES.md §9.4 — the monthly payroll runs. The superadmin creates a month
 * as a draft from everyone's salary, checks it, then finalises it; principal,
 * bursar and office read (FEATURES.md §14).
 */
export function PayrollRunsView() {
  const router = useRouter();
  const accessToken = useAppSelector(selectAccessToken);
  const canRun = decodeAccessToken(accessToken ?? "")?.roles.includes("SUPERADMIN") ?? false;

  const { data: runs = [], isLoading } = useListPayrollRunsQuery();
  const [createRun, creating] = useCreatePayrollRunMutation();

  const today = new Date();
  const thisYear = today.getFullYear();
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(thisYear));
  const years = [thisYear - 1, thisYear, thisYear + 1].map((value) => ({ value: String(value), label: String(value) }));

  const existing = runs.find((run) => run.year === Number(year) && run.month === Number(month));

  async function create() {
    try {
      const run = await createRun({ year: Number(year), month: Number(month) }).unwrap();
      notify.success(`Payroll for ${run.label} created as a draft`, {
        description: `${run.staffCount} payslips. Check them, then finalise.`,
      });
      router.push(`/payroll/${run.id}`);
    } catch (error) {
      notify.error(error, "Could not create this payroll.");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Payroll"
        subtitle="Monthly salaries and payslips"
        actions={
          <AppLinkButton href="/payroll/salaries" variant="secondary">
            <Banknote aria-hidden="true" />
            Salaries
          </AppLinkButton>
        }
      />

      <div className="flex flex-col gap-5">
        {canRun ? (
          <ContentCard>
            <h2 className="mb-1 text-base">Run payroll for a month</h2>
            <p className="text-muted-foreground mb-4 text-xs">
              Copies every staff member&apos;s current salary into a draft. Nothing is final until you finalise it.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <FormField id="run-month" label="Month" className="w-44">
                <NativeSelect
                  {...controlProps("run-month")}
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  options={MONTHS}
                />
              </FormField>
              <FormField id="run-year" label="Year" className="w-28">
                <NativeSelect
                  {...controlProps("run-year")}
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  options={years}
                />
              </FormField>
              {existing ? (
                <AppLinkButton href={`/payroll/${existing.id}`} variant="secondary">
                  Open {existing.label}
                </AppLinkButton>
              ) : (
                <AppButton type="button" onClick={create} disabled={creating.isLoading}>
                  {creating.isLoading ? "Creating…" : "Create draft payroll"}
                </AppButton>
              )}
            </div>
            {existing ? (
              <p className="text-muted-foreground mt-2 text-xs">This month already has a payroll. Open it instead.</p>
            ) : null}
          </ContentCard>
        ) : null}

        <ContentCard flush>
          <DataTable
            columns={runColumns}
            data={runs}
            isLoading={isLoading}
            emptyTitle="No payroll run yet"
            emptyDescription={
              canRun
                ? "Set each staff member's salary under Salaries, then create the first month above."
                : "The superadmin has not run payroll yet."
            }
          />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
