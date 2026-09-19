import { controlProps, FormField } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import type { StudentFieldProps } from "@/components/students/student-field-props";
import { TextInput } from "@/components/common/text-input";
import type { RegisterStudentRequest } from "@/store/api/students-api";

const SEX_OPTIONS = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
];

/** Who the student is: names, date of birth, sex. */
export function StudentIdentityFields({ value, onChange, errors, disabled }: StudentFieldProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="first-name" label="First name" required error={errors.firstName}>
        <TextInput
          {...controlProps("first-name", errors.firstName)}
          autoFocus
          autoComplete="off"
          value={value.firstName}
          disabled={disabled}
          onChange={(event) => onChange({ firstName: event.target.value })}
        />
      </FormField>

      <FormField id="last-name" label="Surname" required error={errors.lastName}>
        <TextInput
          {...controlProps("last-name", errors.lastName)}
          autoComplete="off"
          value={value.lastName}
          disabled={disabled}
          onChange={(event) => onChange({ lastName: event.target.value })}
        />
      </FormField>

      <FormField id="other-names" label="Other names" className="sm:col-span-2" error={errors.otherNames}>
        <TextInput
          {...controlProps("other-names", errors.otherNames)}
          autoComplete="off"
          value={value.otherNames ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ otherNames: event.target.value })}
        />
      </FormField>

      <FormField id="dob" label="Date of birth" required error={errors.dateOfBirth}>
        <TextInput
          {...controlProps("dob", errors.dateOfBirth)}
          type="date"
          value={value.dateOfBirth}
          disabled={disabled}
          onChange={(event) => onChange({ dateOfBirth: event.target.value })}
        />
      </FormField>

      <FormField id="sex" label="Sex" required error={errors.sex}>
        <NativeSelect
          {...controlProps("sex", errors.sex)}
          options={SEX_OPTIONS}
          value={value.sex}
          disabled={disabled}
          onChange={(event) => onChange({ sex: event.target.value as RegisterStudentRequest["sex"] })}
        />
      </FormField>
    </div>
  );
}
