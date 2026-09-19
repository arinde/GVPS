import { Trash2 } from "lucide-react";
import { controlProps, FormField } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { AppButton } from "@/components/common/app-button";
import { GuardianContactFields } from "@/components/students/guardian-contact-fields";
import type { GuardianInput } from "@/store/api/students-api";

const RELATIONSHIPS = [
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

      <GuardianContactFields
        idPrefix={`guardian-${index}`}
        value={value}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      >
        <FormField id={id("relationship")} label="Relationship" required error={errors.relationship}>
          <NativeSelect
            {...controlProps(id("relationship"), errors.relationship)}
            options={RELATIONSHIPS}
            value={value.relationship}
            disabled={disabled}
            onChange={(event) => onChange({ relationship: event.target.value as GuardianInput["relationship"] })}
          />
        </FormField>
      </GuardianContactFields>

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
          <AppButton type="button" variant="ghost" size="small" onClick={onRemove} disabled={disabled}>
            <Trash2 aria-hidden="true" />
            Remove
          </AppButton>
        ) : null}
      </div>
    </fieldset>
  );
}
