import { controlProps, FormField } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";
import type { StaffFieldProps } from "@/components/staff/staff-field-props";

const PHONE_HINT = "e.g. 0801 234 5678";

export type StaffNextOfKinFieldsProps = StaffFieldProps & { relationships: string[] };

/** Who to call in an emergency (FEATURES.md §9.1). */
export function StaffNextOfKinFields({ value, onChange, errors, disabled, relationships }: StaffNextOfKinFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="kin-name" label="Full name" required error={errors.nextOfKinName}>
        <TextInput
          {...controlProps("kin-name", errors.nextOfKinName)}
          autoComplete="off"
          value={value.nextOfKinName}
          disabled={disabled}
          onChange={(event) => onChange({ nextOfKinName: event.target.value })}
        />
      </FormField>

      <FormField id="kin-relationship" label="Relationship" required error={errors.nextOfKinRelationship}>
        <NativeSelect
          {...controlProps("kin-relationship", errors.nextOfKinRelationship)}
          placeholder="Select a relationship…"
          options={relationships.map((relationship) => ({ value: relationship, label: relationship }))}
          value={value.nextOfKinRelationship}
          disabled={disabled}
          onChange={(event) => onChange({ nextOfKinRelationship: event.target.value })}
        />
      </FormField>

      <FormField id="kin-phone" label="Phone" required hint={PHONE_HINT} error={errors.nextOfKinPhone}>
        <TextInput
          {...controlProps("kin-phone", errors.nextOfKinPhone, PHONE_HINT)}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={value.nextOfKinPhone}
          disabled={disabled}
          onChange={(event) => onChange({ nextOfKinPhone: event.target.value })}
        />
      </FormField>
    </div>
  );
}
