import { ROLE_OPTIONS } from "@/components/auth/roles";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { StaffRole } from "@/store/api/staff-api";

export type StaffRolePickerProps = {
  selected: StaffRole[];
  onToggle: (role: StaffRole, checked: boolean) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * A checkbox per role. Separate from the create form because roles are also
 * changed after an account exists, and both places should look the same.
 */
export function StaffRolePicker({ selected, onToggle, error, disabled = false }: StaffRolePickerProps) {
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? "staff-roles-error" : undefined}>
      <legend className="text-foreground mb-1 text-[13px] font-semibold">Roles</legend>
      {ROLE_OPTIONS.map((role) => (
        <Label key={role.value} htmlFor={`role-${role.value}`} className="font-normal">
          <Checkbox
            id={`role-${role.value}`}
            checked={selected.includes(role.value)}
            disabled={disabled}
            onCheckedChange={(checked) => onToggle(role.value, checked)}
          />
          {role.label}
        </Label>
      ))}
      {error ? (
        <p id="staff-roles-error" role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
