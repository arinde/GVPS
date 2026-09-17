import type { FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { GuardianFieldset } from "@/components/students/guardian-fieldset";
import { StudentBioFields } from "@/components/students/student-bio-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ClassArmOption } from "@/store/api/academic-api";
import type { GuardianInput, RegisterStudentRequest } from "@/store/api/students-api";

/**
 * Presentational (AGENTS.md §1): it takes the whole draft plus patch
 * callbacks and renders it. No store reads, no fetching — the view above
 * wires that, which is what makes this testable from props alone.
 */
export type StudentRegistrationFormProps = {
  value: RegisterStudentRequest;
  arms: ClassArmOption[];
  onChange: (patch: Partial<RegisterStudentRequest>) => void;
  onGuardianChange: (index: number, patch: Partial<GuardianInput>) => void;
  onAddGuardian: () => void;
  onRemoveGuardian: (index: number) => void;
  onMakeGuardianPrimary: (index: number) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
};

export function StudentRegistrationForm({
  value,
  arms,
  onChange,
  onGuardianChange,
  onAddGuardian,
  onRemoveGuardian,
  onMakeGuardianPrimary,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: StudentRegistrationFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <section className="flex flex-col gap-4">
        <h2 className="text-base">Student</h2>
        <StudentBioFields value={value} arms={arms} onChange={onChange} />
        {/* FEATURES.md §3.5: photographs are a second pass and must never
            block entry, so there is deliberately no upload here. */}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base">Guardians</h2>
          <Button type="button" variant="outline" size="sm" onClick={onAddGuardian}>
            <UserPlus aria-hidden="true" />
            Add guardian
          </Button>
        </div>

        {value.guardians.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            None added. A student can be registered now and their guardian added later.
          </p>
        ) : (
          value.guardians.map((guardian, index) => (
            <GuardianFieldset
              key={index}
              index={index}
              value={guardian}
              disabled={isSubmitting}
              onChange={(patch) => onGuardianChange(index, patch)}
              onRemove={() => onRemoveGuardian(index)}
              onMakePrimary={() => onMakeGuardianPrimary(index)}
            />
          ))
        )}
      </section>

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
