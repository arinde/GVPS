import { Trash2 } from "lucide-react";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GuardianInput } from "@/store/api/students-api";

const RELATIONSHIPS: { value: GuardianInput["relationship"]; label: string }[] = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
];

export type GuardianFieldsetProps = {
  index: number;
  value: GuardianInput;
  onChange: (patch: Partial<GuardianInput>) => void;
  onRemove: () => void;
  onMakePrimary: () => void;
  disabled?: boolean;
};

export function GuardianFieldset({
  index,
  value,
  onChange,
  onRemove,
  onMakePrimary,
  disabled = false,
}: GuardianFieldsetProps) {
  const prefix = `guardian-${index}`;

  return (
    <fieldset className="border-border rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">Guardian {index + 1}</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={`${prefix}-first`} label="First name" required>
          <Input
            id={`${prefix}-first`}
            value={value.firstName}
            disabled={disabled}
            onChange={(event) => onChange({ firstName: event.target.value })}
          />
        </FormField>

        <FormField id={`${prefix}-last`} label="Surname" required>
          <Input
            id={`${prefix}-last`}
            value={value.lastName}
            disabled={disabled}
            onChange={(event) => onChange({ lastName: event.target.value })}
          />
        </FormField>

        <FormField id={`${prefix}-phone`} label="Phone" required hint="e.g. 08012345678">
          <Input
            id={`${prefix}-phone`}
            type="tel"
            inputMode="tel"
            value={value.phone}
            disabled={disabled}
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </FormField>

        <FormField id={`${prefix}-alt`} label="Alternate phone">
          <Input
            id={`${prefix}-alt`}
            type="tel"
            inputMode="tel"
            value={value.altPhone ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ altPhone: event.target.value })}
          />
        </FormField>

        <FormField id={`${prefix}-relationship`} label="Relationship" required>
          <select
            id={`${prefix}-relationship`}
            className="border-input bg-card h-9 rounded-md border px-3 text-sm"
            value={value.relationship}
            disabled={disabled}
            onChange={(event) => onChange({ relationship: event.target.value as GuardianInput["relationship"] })}
          >
            {RELATIONSHIPS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id={`${prefix}-occupation`} label="Occupation">
          <Input
            id={`${prefix}-occupation`}
            value={value.occupation ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ occupation: event.target.value })}
          />
        </FormField>

        <FormField id={`${prefix}-email`} label="Email" className="sm:col-span-2">
          <Input
            id={`${prefix}-email`}
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

        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled}>
          <Trash2 aria-hidden="true" />
          Remove
        </Button>
      </div>
    </fieldset>
  );
}
