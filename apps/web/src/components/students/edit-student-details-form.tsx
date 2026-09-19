import type { FormEvent } from "react";
import { AppButton } from "@/components/common/app-button";
import { controlProps, FormField } from "@/components/common/form-field";
import { FormSection } from "@/components/common/form-section";
import { TextInput } from "@/components/common/text-input";
import { StudentBackgroundFields } from "@/components/students/student-background-fields";
import { StudentIdentityFields } from "@/components/students/student-identity-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { NigerianState } from "@/store/api/reference-api";
import type { UpdateStudentRequest } from "@/store/api/students-api";

export type EditStudentDetailsFormProps = {
  value: UpdateStudentRequest;
  /** Fixed by the admission number; the exact date must fall inside it. */
  admissionYear: number;
  states: NigerianState[];
  bloodGroups: string[];
  onChange: (patch: Partial<UpdateStudentRequest>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Correcting a registered student's own details. Presentational (AGENTS.md
 * §1): the same field sections as registration, minus what cannot change
 * here — class, admission number and year.
 */
export function EditStudentDetailsForm({
  value,
  admissionYear,
  states,
  bloodGroups,
  onChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  fieldErrors = {},
}: EditStudentDetailsFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const fields = { value, onChange, errors: fieldErrors, disabled: isSubmitting };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <FormSection title="Student">
        <StudentIdentityFields {...fields} />
      </FormSection>

      <FormSection title="Home and health">
        <StudentBackgroundFields {...fields} states={states} bloodGroups={bloodGroups} />
      </FormSection>

      <FormSection
        title="Admission"
        description={`Admitted in ${admissionYear}. The year is part of the admission number and cannot change.`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="admission-date"
            label="Exact date of admission"
            hint="Optional"
            error={fieldErrors.dateOfAdmission}
          >
            <TextInput
              {...controlProps("admission-date", fieldErrors.dateOfAdmission, "Optional")}
              type="date"
              min={`${admissionYear}-01-01`}
              max={`${admissionYear}-12-31`}
              value={value.dateOfAdmission ?? ""}
              disabled={isSubmitting}
              onChange={(event) => onChange({ dateOfAdmission: event.target.value })}
            />
          </FormField>

          <FormField id="previous-school" label="Previous school" error={fieldErrors.previousSchool}>
            <TextInput
              {...controlProps("previous-school", fieldErrors.previousSchool)}
              value={value.previousSchool ?? ""}
              disabled={isSubmitting}
              onChange={(event) => onChange({ previousSchool: event.target.value })}
            />
          </FormField>
        </div>
      </FormSection>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <AppButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save student details"}
        </AppButton>
      </div>
    </form>
  );
}
