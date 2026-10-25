"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";

type Action = "refresh" | "finalise" | "delete";

const CONFIRM: Record<Action, { message: string; confirmLabel: string; variant: "primary" | "danger" }> = {
  refresh: {
    message:
      "Copy every payslip again from the current salaries? Any adjustment made to this month's payslips is lost.",
    confirmLabel: "Yes, refresh",
    variant: "primary",
  },
  finalise: {
    message:
      "Finalise this payroll? Payslips are locked for good and staff can see theirs on My profile. Check the figures first.",
    confirmLabel: "Yes, finalise",
    variant: "primary",
  },
  delete: {
    message: "Delete this draft payroll? Nothing has been issued, so you can create the month again afterwards.",
    confirmLabel: "Yes, delete draft",
    variant: "danger",
  },
};

export type RunDraftActionsProps = {
  label: string;
  busy: boolean;
  /** Each resolves true once done, false if it failed (the caller has already said why). */
  onRefresh: () => Promise<boolean>;
  onFinalise: () => Promise<boolean>;
  onDelete: () => Promise<boolean>;
};

/** What the superadmin can do with a draft month, each asking once before it acts. Presentational. */
export function RunDraftActions({ label, busy, onRefresh, onFinalise, onDelete }: RunDraftActionsProps) {
  const [pending, setPending] = useState<Action | null>(null);
  const handlers: Record<Action, () => Promise<boolean>> = {
    refresh: onRefresh,
    finalise: onFinalise,
    delete: onDelete,
  };

  async function confirm(action: Action) {
    // Stays open on failure, so the person can retry without starting over.
    if (await handlers[action]()) setPending(null);
  }

  return (
    <ContentCard>
      <h2 className="mb-1 text-base">This payroll is a draft</h2>
      <p className="text-muted-foreground mb-4 text-xs">
        Check each payslip for {label}. Adjust one for a one-off bonus or deduction, or refresh them all after changing
        salaries. Staff see their payslip only once it is finalised.
      </p>

      {pending ? (
        <div role="alertdialog" aria-label="Confirm" className="bg-canvas flex flex-col gap-3 rounded-lg p-4">
          <p className="text-sm">{CONFIRM[pending].message}</p>
          <div className="flex flex-wrap gap-3">
            <AppButton
              type="button"
              variant={CONFIRM[pending].variant}
              disabled={busy}
              onClick={() => confirm(pending)}
            >
              {busy ? "Working…" : CONFIRM[pending].confirmLabel}
            </AppButton>
            <AppButton type="button" variant="ghost" disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </AppButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <AppButton type="button" onClick={() => setPending("finalise")}>
            <CheckCircle2 aria-hidden="true" />
            Finalise payroll
          </AppButton>
          <AppButton type="button" variant="secondary" onClick={() => setPending("refresh")}>
            <RefreshCw aria-hidden="true" />
            Refresh from salaries
          </AppButton>
          <AppButton type="button" variant="danger" onClick={() => setPending("delete")}>
            <Trash2 aria-hidden="true" />
            Delete draft
          </AppButton>
        </div>
      )}
    </ContentCard>
  );
}
