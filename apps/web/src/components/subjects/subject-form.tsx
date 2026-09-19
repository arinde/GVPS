import type { FormEvent } from "react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { TextInput } from "@/components/common/text-input";
import type { SubjectRequest } from "@/store/api/subjects-api";

export type SubjectFormProps = {
  value: SubjectRequest;
  onChange: (patch: Partial<SubjectRequest>) => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
  submitLabel: string;
  /** Ids must differ when two forms share a page. */
  idPrefix?: string;
};

const CODE_HINT = "2–8 letters, e.g. MTH";

/** A subject's name and code, for adding or renaming. Presentational. */
export function SubjectForm({
  value,
  onChange,
  onSubmit,
  errors = {},
  isSubmitting = false,
  submitLabel,
  idPrefix = "subject",
}: SubjectFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-4 sm:grid-cols-[1fr_160px_auto]">
      <FormField id={id("name")} label="Subject name" required error={errors.name}>
        <TextInput
          {...controlProps(id("name"), errors.name)}
          value={value.name}
          placeholder="e.g. Mathematics"
          disabled={isSubmitting}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </FormField>
      <FormField id={id("code")} label="Code" required hint={CODE_HINT} error={errors.code}>
        <TextInput
          {...controlProps(id("code"), errors.code, CODE_HINT)}
          value={value.code}
          maxLength={8}
          autoCapitalize="characters"
          disabled={isSubmitting}
          onChange={(event) => onChange({ code: event.target.value.toUpperCase() })}
        />
      </FormField>
      <div className="flex flex-col gap-1.5">
        <span aria-hidden="true" className="hidden h-5 sm:block" />
        <AppButton type="submit" disabled={isSubmitting || !value.name.trim() || !value.code.trim()}>
          {isSubmitting ? "Saving…" : submitLabel}
        </AppButton>
      </div>
    </form>
  );
}
