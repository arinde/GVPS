import { controlProps, FormField } from "@/components/common/form-field";
import { TextInput } from "@/components/common/text-input";
import type { StaffFieldProps } from "@/components/staff/staff-field-props";

const PHONE_HINT = "e.g. 0801 234 5678";

/** Who the staff member is and how to reach them. */
export function StaffDetailsFields({ value, onChange, errors, disabled }: StaffFieldProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="staff-first-name" label="First name" required error={errors.firstName}>
        <TextInput
          {...controlProps("staff-first-name", errors.firstName)}
          autoFocus
          autoComplete="off"
          value={value.firstName}
          disabled={disabled}
          onChange={(event) => onChange({ firstName: event.target.value })}
        />
      </FormField>

      <FormField id="staff-last-name" label="Surname" required error={errors.lastName}>
        <TextInput
          {...controlProps("staff-last-name", errors.lastName)}
          autoComplete="off"
          value={value.lastName}
          disabled={disabled}
          onChange={(event) => onChange({ lastName: event.target.value })}
        />
      </FormField>

      <FormField id="staff-other-names" label="Other names" error={errors.otherNames}>
        <TextInput
          {...controlProps("staff-other-names", errors.otherNames)}
          autoComplete="off"
          value={value.otherNames ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ otherNames: event.target.value })}
        />
      </FormField>

      <FormField id="staff-phone" label="Phone" required hint={PHONE_HINT} error={errors.phone}>
        <TextInput
          {...controlProps("staff-phone", errors.phone, PHONE_HINT)}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={value.phone}
          disabled={disabled}
          onChange={(event) => onChange({ phone: event.target.value })}
        />
      </FormField>

      <FormField id="staff-email" label="Email" required className="sm:col-span-2" error={errors.email}>
        <TextInput
          {...controlProps("staff-email", errors.email)}
          type="email"
          autoComplete="off"
          value={value.email}
          disabled={disabled}
          onChange={(event) => onChange({ email: event.target.value })}
        />
      </FormField>

      <FormField id="staff-address" label="Home address" required className="sm:col-span-2" error={errors.address}>
        <TextInput
          {...controlProps("staff-address", errors.address)}
          autoComplete="off"
          value={value.address}
          disabled={disabled}
          onChange={(event) => onChange({ address: event.target.value })}
        />
      </FormField>
    </div>
  );
}
