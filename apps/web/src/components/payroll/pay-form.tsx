"use client";

import { useState, type FormEvent } from "react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { TextInput } from "@/components/common/text-input";
import { clearError, readDraft, toDraft, totalsOf, type PayDraft } from "@/components/payroll/pay-draft";
import { PayLinesEditor } from "@/components/payroll/pay-lines-editor";
import { formatKobo } from "@/lib/money";
import type { PayLines } from "@/store/api/payroll-api";

const ALLOWANCE_NAMES = ["Housing", "Transport", "Meal", "Utility", "Responsibility", "Leave allowance"];
const DEDUCTION_NAMES = ["PAYE tax", "Pension (employee)", "NHF", "Salary advance", "Cooperative", "Loan repayment"];

export type PayFormProps = {
  /** Starting figures; null for someone with no salary yet. Change `key` to start over with new ones. */
  initial: PayLines | null;
  submitLabel: string;
  saving: boolean;
  /** Resolves to field errors from the API, keyed as the draft's are, or nothing on success. */
  onSubmit: (lines: PayLines) => Promise<Record<string, string> | void>;
  onCancel: () => void;
};

/**
 * Basic pay, allowances and deductions, with the totals worked out as you
 * type. Serves both a salary structure and a one-off change to a draft
 * payslip, which have the same shape.
 */
export function PayForm({ initial, submitLabel, saving, onSubmit, onCancel }: PayFormProps) {
  const [draft, setDraft] = useState<PayDraft>(() => toDraft(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Worked out on every render from what is typed; invalid amounts count as zero until fixed.
  const preview = totalsOf(readDraft(draft).lines);

  function change(patch: Partial<PayDraft>, key: string, group?: string) {
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      // The list-level summary ("deductions exceed gross") may no longer hold either.
      const cleared = clearError(current, key);
      if (group) delete cleared[group];
      return cleared;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { lines, errors: found } = readDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const serverErrors = await onSubmit(lines);
    if (serverErrors) setErrors(serverErrors);
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormField
        id="pay-basic"
        label="Basic salary per month (₦)"
        hint="Before allowances and deductions."
        error={errors.basicKobo}
        className="max-w-xs"
      >
        <TextInput
          {...controlProps("pay-basic", errors.basicKobo, "Before allowances and deductions.")}
          inputMode="decimal"
          autoFocus
          value={draft.basic}
          onChange={(event) => change({ basic: event.target.value }, "basicKobo")}
        />
      </FormField>

      <PayLinesEditor
        field="allowances"
        legend="Allowances"
        itemLabel="Allowance"
        lines={draft.allowances}
        errors={errors}
        suggestions={ALLOWANCE_NAMES}
        addLabel="Add allowance"
        emptyText="No allowances. Add one for housing, transport and so on."
        onChange={(allowances, key) => change({ allowances }, key)}
      />

      <PayLinesEditor
        field="deductions"
        legend="Deductions"
        itemLabel="Deduction"
        lines={draft.deductions}
        errors={errors}
        suggestions={DEDUCTION_NAMES}
        addLabel="Add deduction"
        emptyText="No deductions. Enter tax and pension as the amounts your accountant gives you."
        onChange={(deductions, key) => change({ deductions }, key, "deductions")}
      />

      <dl className="bg-canvas grid grid-cols-3 gap-3 rounded-lg p-4 text-sm">
        <div>
          <dt className="text-muted-foreground text-xs">Gross pay</dt>
          <dd className="font-semibold tabular-nums">{formatKobo(preview.grossKobo)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Deductions</dt>
          <dd className="font-semibold tabular-nums">{formatKobo(preview.deductionsKobo)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Net pay</dt>
          <dd className="font-semibold tabular-nums">{formatKobo(preview.netKobo)}</dd>
        </div>
      </dl>

      {errorCount > 0 ? (
        <p role="alert" className="text-destructive text-sm">
          {errorCount === 1 ? "One thing needs fixing" : `${errorCount} things need fixing`} — see the messages above.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <AppButton type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </AppButton>
        <AppButton type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </AppButton>
      </div>
    </form>
  );
}
