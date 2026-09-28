import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";

export type TermDraft = { sequence: string; name: string; startDate: string; endDate: string };

export type TermFormProps = {
  /** Unique per session, so two open forms never share field ids. */
  idPrefix: string;
  value: TermDraft;
  /** Only the terms this session does not have yet. */
  sequences: { value: string; label: string }[];
  onChange: (patch: Partial<TermDraft>) => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
};

/** Adds one term to a session. Dates must fall inside the session; the API checks that too. */
export function TermForm({
  idPrefix,
  value,
  sequences,
  onChange,
  onSubmit,
  errors = {},
  isSubmitting = false,
}: TermFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-4 sm:grid-cols-[180px_1fr_1fr_auto]">
      <FormField id={id("sequence")} label="Term" required error={errors.sequence}>
        <NativeSelect
          {...controlProps(id("sequence"), errors.sequence)}
          placeholder="Choose…"
          options={sequences}
          value={value.sequence}
          disabled={isSubmitting}
          onChange={(event) => {
            const chosen = sequences.find((option) => option.value === event.target.value);
            onChange({ sequence: event.target.value, name: chosen?.label ?? "" });
          }}
        />
      </FormField>

      <FormField id={id("start")} label="First day" required error={errors.startDate}>
        <TextInput
          {...controlProps(id("start"), errors.startDate)}
          type="date"
          value={value.startDate}
          disabled={isSubmitting}
          onChange={(event) => onChange({ startDate: event.target.value })}
        />
      </FormField>

      <FormField id={id("end")} label="Last day" required error={errors.endDate}>
        <TextInput
          {...controlProps(id("end"), errors.endDate)}
          type="date"
          value={value.endDate}
          disabled={isSubmitting}
          onChange={(event) => onChange({ endDate: event.target.value })}
        />
      </FormField>

      <div className="flex flex-col gap-1.5">
        <span aria-hidden="true" className="hidden h-5 sm:block" />
        <AppButton
          type="submit"
          variant="secondary"
          disabled={isSubmitting || !value.sequence || !value.startDate || !value.endDate}
        >
          <Plus aria-hidden="true" />
          {isSubmitting ? "Adding…" : "Add term"}
        </AppButton>
      </div>
    </form>
  );
}
