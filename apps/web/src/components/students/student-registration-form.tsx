import type { FormEvent, ReactNode } from "react";
import { UserPlus } from "lucide-react";
import { GuardianFieldset } from "@/components/students/guardian-fieldset";
import { StudentBackgroundFields } from "@/components/students/student-background-fields";
import { StudentClassFields } from "@/components/students/student-class-fields";
import { StudentIdentityFields } from "@/components/students/student-identity-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { scopedErrors } from "@/lib/api-error";
import type { ClassArmOption } from "@/store/api/academic-api";
import type { NigerianState } from "@/store/api/reference-api";
import type { GuardianInput, RegisterStudentRequest } from "@/store/api/students-api";

/**
 * Presentational (AGENTS.md §1): the whole draft, the lists it needs, and
 * patch callbacks. No store reads, no fetching — the view above wires that,
 * which is what makes this testable from props alone.
 */
export type StudentRegistrationFormProps = {
  value: RegisterStudentRequest;
  arms: ClassArmOption[];
  states: NigerianState[];
  bloodGroups: string[];
  onChange: (patch: Partial<RegisterStudentRequest>) => void;
  onGuardianChange: (index: number, patch: Partial<GuardianInput>) => void;
  onAddGuardian: () => void;
  onRemoveGuardian: (index: number) => void;
  onMakeGuardianPrimary: (index: number) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
  /** Keyed by the API's field path: "dateOfBirth", "guardians.0.phone". */
  fieldErrors?: Record<string, string>;
};

const MAX_GUARDIANS = 4;

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="border-border flex items-center justify-between border-b pb-2">
        <h2 className="text-base">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StudentRegistrationForm({
  value,
  arms,
  states,
  bloodGroups,
  onChange,
  onGuardianChange,
  onAddGuardian,
  onRemoveGuardian,
  onMakeGuardianPrimary,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  fieldErrors = {},
}: StudentRegistrationFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const fields = { value, onChange, errors: fieldErrors, disabled: isSubmitting };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <Section title="Student">
        <StudentIdentityFields {...fields} />
      </Section>

      <Section title="Class">
        <StudentClassFields {...fields} arms={arms} />
      </Section>

      <Section title="Home and health">
        <StudentBackgroundFields {...fields} states={states} bloodGroups={bloodGroups} />
        {/* FEATURES.md §3.5: photographs are a second pass and must never
            block entry, so there is deliberately no upload here. */}
      </Section>

      <Section
        title="Parents and guardians"
        action={
          value.guardians.length < MAX_GUARDIANS ? (
            <Button type="button" variant="outline" size="sm" onClick={onAddGuardian} disabled={isSubmitting}>
              <UserPlus aria-hidden="true" />
              Add another
            </Button>
          ) : null
        }
      >
        {fieldErrors.guardians ? (
          <p role="alert" className="text-destructive text-sm">
            {fieldErrors.guardians}
          </p>
        ) : null}

        {value.guardians.map((guardian, index) => (
          <GuardianFieldset
            key={index}
            index={index}
            value={guardian}
            errors={scopedErrors(fieldErrors, `guardians.${index}`)}
            canRemove={value.guardians.length > 1}
            disabled={isSubmitting}
            onChange={(patch) => onGuardianChange(index, patch)}
            onRemove={() => onRemoveGuardian(index)}
            onMakePrimary={() => onMakeGuardianPrimary(index)}
          />
        ))}
      </Section>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering…" : "Register student"}
        </Button>
      </div>
    </form>
  );
}
