import { Trash2 } from "lucide-react";
import { controlProps, FormField } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GuardianInput } from "@/store/api/students-api";

const RELATIONSHIPS = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
];

const PHONE_HINT = "e.g. 0801 234 5678";

export type GuardianFieldsetProps = {
  index: number;
  value: GuardianInput;
  onChange: (patch: Partial<GuardianInput>) => void;
  onRemove: () => void;
  onMakePrimary: () => void;
  /** False for the last remaining guardian: at least one is required. */
  canRemove: boolean;
  /** This guardian's errors, keyed by field name ("phone"), not the full path. */
  errors?: Record<string, string>;
  disabled?: boolean;
};

export function GuardianFieldset({
  index,
  value,
  onChange,
  onRemove,
  onMakePrimary,
  canRemove,
  errors = {},
  disabled = false,
}: GuardianFieldsetProps) {
  const id = (field: string) => `guardian-${index}-${field}`;

  return (
    <fieldset className="border-border rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">Parent or guardian {index + 1}</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={id("first")} label="First name" required error={errors.firstName}>
          <Input
            {...controlProps(id("first"), errors.firstName)}
            value={value.firstName}
            disabled={disabled}
            onChange={(event) => onChange({ firstName: event.target.value })}
          />
        </FormField>

        <FormField id={id("last")} label="Surname" required error={errors.lastName}>
          <Input
            {...controlProps(id("last"), errors.lastName)}
            value={value.lastName}
            disabled={disabled}
            onChange={(event) => onChange({ lastName: event.target.value })}
          />
        </FormField>

        <FormField id={id("phone")} label="Phone" required hint={PHONE_HINT} error={errors.phone}>
          <Input
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
          <Input
            {...controlProps(id("alt"), errors.altPhone)}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            value={value.altPhone ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ altPhone: event.target.value || undefined })}
          />
        </FormField>

        <FormField id={id("relationship")} label="Relationship" required error={errors.relationship}>
          <NativeSelect
            {...controlProps(id("relationship"), errors.relationship)}
            options={RELATIONSHIPS}
            value={value.relationship}
            disabled={disabled}
            onChange={(event) => onChange({ relationship: event.target.value as GuardianInput["relationship"] })}
          />
        </FormField>

        <FormField id={id("occupation")} label="Occupation" error={errors.occupation}>
          <Input
            {...controlProps(id("occupation"), errors.occupation)}
            value={value.occupation ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ occupation: event.target.value })}
          />
        </FormField>

        <FormField id={id("email")} label="Email" className="sm:col-span-2" error={errors.email}>
          <Input
            {...controlProps(id("email"), errors.email)}
            type="email"
            value={value.email ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ email: event.target.value })}
          />
        </FormField>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {/* Radio, not a checkbox: exactly one guardian is the school's first
            call, and the API rejects two primaries. */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="primary-guardian"
            checked={value.isPrimary}
            disabled={disabled}
            onChange={onMakePrimary}
          />
          Primary contact
        </label>

        {canRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled}>
            <Trash2 aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </div>
    </fieldset>
  );
}
