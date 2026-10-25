import { Plus, Trash2 } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { TextInput } from "@/components/common/text-input";
import type { LineDraft } from "@/components/payroll/pay-draft";

export type PayLinesEditorProps = {
  /** "allowances" or "deductions" — also the prefix of the error keys, matching the API's zod paths. */
  field: string;
  legend: string;
  /** Singular, for each row's label: "Allowance", "Deduction". */
  itemLabel: string;
  lines: LineDraft[];
  errors: Record<string, string>;
  /** Common names offered as you type, without stopping a school using its own. */
  suggestions: string[];
  addLabel: string;
  emptyText: string;
  onChange: (lines: LineDraft[], changedKey: string) => void;
};

/** A list of named amounts — allowances or deductions — with add and remove. Presentational. */
export function PayLinesEditor({
  field,
  legend,
  itemLabel,
  lines,
  errors,
  suggestions,
  addLabel,
  emptyText,
  onChange,
}: PayLinesEditorProps) {
  const listId = `${field}-suggestions`;

  function update(index: number, patch: Partial<LineDraft>, key: string) {
    onChange(
      lines.map((line, at) => (at === index ? { ...line, ...patch } : line)),
      key,
    );
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-foreground mb-2 text-sm font-semibold">{legend}</legend>
      <datalist id={listId}>
        {suggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {lines.length === 0 ? <p className="text-muted-foreground text-xs">{emptyText}</p> : null}

      {lines.map((line, index) => {
        const nameKey = `${field}.${index}.name`;
        const amountKey = `${field}.${index}.amountKobo`;
        const nameId = `${field}-${index}-name`;
        const amountId = `${field}-${index}-amount`;
        return (
          <div key={index} className="grid grid-cols-[1fr_9rem_auto] items-start gap-2">
            <FormField id={nameId} label={itemLabel} error={errors[nameKey]}>
              <TextInput
                {...controlProps(nameId, errors[nameKey])}
                list={listId}
                value={line.name}
                onChange={(event) => update(index, { name: event.target.value }, nameKey)}
              />
            </FormField>
            <FormField id={amountId} label="Amount (₦)" error={errors[amountKey]}>
              <TextInput
                {...controlProps(amountId, errors[amountKey])}
                inputMode="decimal"
                value={line.amount}
                onChange={(event) => update(index, { amount: event.target.value }, amountKey)}
              />
            </FormField>
            <AppButton
              type="button"
              variant="ghost"
              size="small"
              className="mt-7"
              aria-label={`Remove ${line.name || `${itemLabel.toLowerCase()} ${index + 1}`}`}
              onClick={() =>
                onChange(
                  lines.filter((_, at) => at !== index),
                  field,
                )
              }
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </AppButton>
          </div>
        );
      })}

      {errors[field] ? (
        <p role="alert" className="text-destructive text-xs">
          {errors[field]}
        </p>
      ) : null}

      <AppButton
        type="button"
        variant="secondary"
        size="small"
        className="self-start"
        onClick={() => onChange([...lines, { name: "", amount: "" }], field)}
      >
        <Plus aria-hidden="true" />
        {addLabel}
      </AppButton>
    </fieldset>
  );
}
