import type { FormEvent } from "react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";
import type { ExitStatus } from "@/store/api/promotions-api";

export type RecordExitDraft = { status: ExitStatus | ""; exitedOn: string; reason: string };

export const EXIT_OPTIONS = [
  { value: "TRANSFERRED", label: "Transferred to another school" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "GRADUATED", label: "Graduated" },
];

export type RecordExitFormProps = {
  value: RecordExitDraft;
  onChange: (patch: Partial<RecordExitDraft>) => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
};

/** Records that a student has left: how, when and why. Presentational. */
export function RecordExitForm({ value, onChange, onSubmit, errors = {}, isSubmitting = false }: RecordExitFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="exit-status" label="What happened" required error={errors.status}>
          <NativeSelect
            {...controlProps("exit-status", errors.status)}
            placeholder="Choose…"
            options={EXIT_OPTIONS}
            value={value.status}
            disabled={isSubmitting}
            onChange={(event) => onChange({ status: event.target.value as ExitStatus | "" })}
          />
        </FormField>

        <FormField id="exit-date" label="Last day" required error={errors.exitedOn}>
          <TextInput
            {...controlProps("exit-date", errors.exitedOn)}
            type="date"
            value={value.exitedOn}
            disabled={isSubmitting}
            onChange={(event) => onChange({ exitedOn: event.target.value })}
          />
        </FormField>

        <FormField id="exit-reason" label="Reason" hint="Optional" error={errors.reason}>
          <TextInput
            {...controlProps("exit-reason", errors.reason, "Optional")}
            value={value.reason}
            disabled={isSubmitting}
            onChange={(event) => onChange({ reason: event.target.value })}
          />
        </FormField>
      </div>

      <div className="flex flex-col items-start gap-1">
        <AppButton type="submit" variant="danger" disabled={isSubmitting || !value.status || !value.exitedOn}>
          {isSubmitting ? "Recording…" : "Record that they left"}
        </AppButton>
        {!value.status || !value.exitedOn ? (
          <p className="text-muted-foreground text-xs">Choose how they left and the date to continue.</p>
        ) : null}
      </div>
    </form>
  );
}
