import { controlProps, FormField } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import type { StudentFieldProps } from "@/components/students/student-field-props";
import { Input } from "@/components/ui/input";
import type { NigerianState } from "@/store/api/reference-api";

export type StudentBackgroundFieldsProps = StudentFieldProps & {
  states: NigerianState[];
  bloodGroups: string[];
};

const ADDRESS_HINT = "Where the student lives now";
const BLOOD_GROUP_HINT = "Leave as 'Not known' if unsure";

/**
 * Origin, home and health. The LGA list is driven by the chosen state and
 * stays disabled until a state is picked, so a Kano student cannot be saved
 * in a Lagos LGA. The API checks the same pairing.
 */
export function StudentBackgroundFields({
  value,
  onChange,
  errors,
  disabled,
  states,
  bloodGroups,
}: StudentBackgroundFieldsProps) {
  const lgas = states.find((entry) => entry.state === value.stateOfOrigin)?.lgas ?? [];
  const lgaHint = value.stateOfOrigin ? undefined : "Choose the state first";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="state" label="State of origin" error={errors.stateOfOrigin}>
        <NativeSelect
          {...controlProps("state", errors.stateOfOrigin)}
          placeholder="Select a state…"
          options={states.map((entry) => ({ value: entry.state, label: entry.state }))}
          value={value.stateOfOrigin ?? ""}
          disabled={disabled}
          // A new state invalidates the LGA, so it is cleared in the same change.
          onChange={(event) => onChange({ stateOfOrigin: event.target.value || undefined, lga: undefined })}
        />
      </FormField>

      <FormField id="lga" label="LGA" hint={lgaHint} error={errors.lga}>
        <NativeSelect
          {...controlProps("lga", errors.lga, lgaHint)}
          placeholder={value.stateOfOrigin ? "Select an LGA…" : "—"}
          options={lgas.map((lga) => ({ value: lga, label: lga }))}
          value={value.lga ?? ""}
          disabled={disabled || !value.stateOfOrigin}
          onChange={(event) => onChange({ lga: event.target.value || undefined })}
        />
      </FormField>

      <FormField id="address" label="Home address" hint={ADDRESS_HINT} className="sm:col-span-2" error={errors.address}>
        <Input
          {...controlProps("address", errors.address, ADDRESS_HINT)}
          autoComplete="street-address"
          value={value.address ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ address: event.target.value })}
        />
      </FormField>

      <FormField id="blood-group" label="Blood group" hint={BLOOD_GROUP_HINT} error={errors.bloodGroup}>
        <NativeSelect
          {...controlProps("blood-group", errors.bloodGroup, BLOOD_GROUP_HINT)}
          placeholder="Not known"
          options={bloodGroups.map((group) => ({ value: group, label: group }))}
          value={value.bloodGroup ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ bloodGroup: event.target.value || undefined })}
        />
      </FormField>

      <FormField id="medical-note" label="Standing medical note" error={errors.medicalNote}>
        <Input
          {...controlProps("medical-note", errors.medicalNote)}
          placeholder="e.g. asthma, allergies"
          value={value.medicalNote ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ medicalNote: event.target.value })}
        />
      </FormField>
    </div>
  );
}
