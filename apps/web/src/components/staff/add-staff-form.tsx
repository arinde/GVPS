import type { FormEvent } from "react";
import { AppButton } from "@/components/common/app-button";
import { FormSection } from "@/components/common/form-section";
import { StaffDetailsFields } from "@/components/staff/staff-details-fields";
import { StaffNextOfKinFields } from "@/components/staff/staff-next-of-kin-fields";
import { StaffRolePicker } from "@/components/staff/staff-role-picker";
import { StaffSalaryAccountFields } from "@/components/staff/staff-salary-account-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CreateStaffRequest, StaffRole } from "@/store/api/staff-api";

export type AddStaffFormProps = {
  value: CreateStaffRequest;
  banks: string[];
  relationships: string[];
  onChange: (patch: Partial<CreateStaffRequest>) => void;
  onRoleToggle: (role: StaffRole, checked: boolean) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
  /** Keyed by the API's field path: "firstName", "accountNumber", "roles". */
  fieldErrors?: Record<string, string>;
};

/** Presentational (AGENTS.md §1): the draft, the lists and callbacks in; nothing fetched. */
export function AddStaffForm({
  value,
  banks,
  relationships,
  onChange,
  onRoleToggle,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  fieldErrors = {},
}: AddStaffFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const fields = { value, onChange, errors: fieldErrors, disabled: isSubmitting };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <FormSection title="Personal details">
        <StaffDetailsFields {...fields} />
      </FormSection>

      <FormSection title="Next of kin" description="Who the school should call in an emergency.">
        <StaffNextOfKinFields {...fields} relationships={relationships} />
      </FormSection>

      <FormSection
        title="Salary account"
        description="Optional now — add it later if it is not to hand. Only the superadmin and the staff member can see it."
      >
        <StaffSalaryAccountFields {...fields} banks={banks} />
      </FormSection>

      <FormSection title="Access">
        <StaffRolePicker
          selected={value.roles}
          onToggle={onRoleToggle}
          error={fieldErrors.roles}
          disabled={isSubmitting}
        />
      </FormSection>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col items-end gap-1">
        <AppButton type="submit" disabled={isSubmitting || value.roles.length === 0}>
          {isSubmitting ? "Creating…" : "Create staff account"}
        </AppButton>
        {/* A disabled button always says why (STITCH-GLOBAL.md §13). */}
        {value.roles.length === 0 ? (
          <p className="text-muted-foreground text-xs">Choose at least one role to continue.</p>
        ) : null}
      </div>
    </form>
  );
}
