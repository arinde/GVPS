import { ROLE_OPTIONS } from "@/components/auth/roles";
import { CheckboxGroup } from "@/components/common/checkbox-group";
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
    <CheckboxGroup
      id="role"
      legend="Roles"
      options={ROLE_OPTIONS}
      selected={selected}
      onToggle={(value, checked) => onToggle(value as StaffRole, checked)}
      error={error}
      disabled={disabled}
    />
  );
}
