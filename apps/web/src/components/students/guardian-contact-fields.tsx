import type { ReactNode } from "react";
import { controlProps, FormField } from "@/components/common/form-field";
import { TextInput } from "@/components/common/text-input";
import type { GuardianInput } from "@/store/api/students-api";

export type GuardianContact = Pick<
  GuardianInput,
  "firstName" | "lastName" | "phone" | "altPhone" | "email" | "occupation"
>;

const PHONE_HINT = "e.g. 0801 234 5678";

export type GuardianContactFieldsProps = {
  /** Prefix for field ids, unique on the page: "guardian-0". */
  idPrefix: string;
  value: GuardianContact;
  onChange: (patch: Partial<GuardianContact>) => void;
  /** Keyed by field name ("phone"), not the full API path. */
  errors?: Record<string, string>;
  disabled?: boolean;
  /** Extra fields placed before occupation, e.g. the relationship select during registration. */
  children?: ReactNode;
};

/**
 * A parent or guardian's own details. Shared by registration, where they sit
 * with the relationship and primary-contact controls, and by editing, where
 * only the person's details change. Presentational.
 */
export function GuardianContactFields({
  idPrefix,
  value,
  onChange,
  errors = {},
  disabled = false,
  children,
}: GuardianContactFieldsProps) {
  const id = (field: string) => `${idPrefix}-${field}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id={id("first")} label="First name" required error={errors.firstName}>
        <TextInput
          {...controlProps(id("first"), errors.firstName)}
          value={value.firstName}
          disabled={disabled}
          onChange={(event) => onChange({ firstName: event.target.value })}
        />
      </FormField>

      <FormField id={id("last")} label="Surname" required error={errors.lastName}>
        <TextInput
          {...controlProps(id("last"), errors.lastName)}
          value={value.lastName}
          disabled={disabled}
          onChange={(event) => onChange({ lastName: event.target.value })}
        />
      </FormField>

      <FormField id={id("phone")} label="Phone" required hint={PHONE_HINT} error={errors.phone}>
        <TextInput
          {...controlProps(id("phone"), errors.phone, PHONE_HINT)}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={value.phone}
          disabled={disabled}
          onChange={(event) => onChange({ phone: event.target.value })}
        />
      </FormField>

      <FormField id={id("alt")} label="Alternate phone" error={errors.altPhone}>
        <TextInput
          {...controlProps(id("alt"), errors.altPhone)}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={value.altPhone ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ altPhone: event.target.value || undefined })}
        />
      </FormField>

      {children}

      <FormField id={id("occupation")} label="Occupation" error={errors.occupation}>
        <TextInput
          {...controlProps(id("occupation"), errors.occupation)}
          value={value.occupation ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ occupation: event.target.value })}
        />
      </FormField>

      <FormField id={id("email")} label="Email" className="sm:col-span-2" error={errors.email}>
        <TextInput
          {...controlProps(id("email"), errors.email)}
          type="email"
          value={value.email ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ email: event.target.value })}
        />
      </FormField>
    </div>
  );
}
