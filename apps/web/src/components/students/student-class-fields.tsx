import { controlProps, FormField } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import type { StudentFieldProps } from "@/components/students/student-field-props";
import { TextInput } from "@/components/common/text-input";
import type { ClassArmOption } from "@/store/api/academic-api";
import type { RegisterStudentRequest } from "@/store/api/students-api";

export const DEPARTMENT_OPTIONS = [
  { value: "SCIENCE", label: "Science" },
  { value: "ARTS", label: "Arts" },
  { value: "COMMERCIAL", label: "Commercial" },
];

export type StudentClassFieldsProps = StudentFieldProps & { arms: ClassArmOption[] };

/**
 * Where the student is placed: class, department and admission date.
 *
 * The department appears only for a senior (SSS) class, because only senior
 * students have one — showing it to a Primary 3 entry would invite a wrong
 * answer. If the class itself is tagged with a department, that decides it
 * and there is nothing to choose.
 */
export function StudentClassFields({ value, onChange, errors, disabled, arms }: StudentClassFieldsProps) {
  const selectedArm = arms.find((arm) => arm.id === value.classArmId);
  const isSenior = selectedArm?.classLevel.section === "SENIOR";
  const fixedDepartment = DEPARTMENT_OPTIONS.find((option) => option.value === selectedArm?.stream);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="class-arm" label="Class" required error={errors.classArmId}>
        <NativeSelect
          {...controlProps("class-arm", errors.classArmId)}
          placeholder="Select a class…"
          options={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
          value={value.classArmId}
          disabled={disabled}
          onChange={(event) => onChange({ classArmId: event.target.value })}
        />
      </FormField>

      {isSenior ? (
        fixedDepartment ? (
          <FormField id="department" label="Department" hint={`Set by the class: ${fixedDepartment.label}`}>
            <TextInput id="department" value={fixedDepartment.label} disabled readOnly />
          </FormField>
        ) : (
          <FormField id="department" label="Department" required error={errors.stream}>
            <NativeSelect
              {...controlProps("department", errors.stream)}
              placeholder="Select a department…"
              options={DEPARTMENT_OPTIONS}
              value={value.stream ?? ""}
              disabled={disabled}
              onChange={(event) =>
                onChange({ stream: (event.target.value || undefined) as RegisterStudentRequest["stream"] })
              }
            />
          </FormField>
        )
      ) : null}

      <FormField id="admission-date" label="Date of admission" required error={errors.dateOfAdmission}>
        <TextInput
          {...controlProps("admission-date", errors.dateOfAdmission)}
          type="date"
          value={value.dateOfAdmission}
          disabled={disabled}
          onChange={(event) => onChange({ dateOfAdmission: event.target.value })}
        />
      </FormField>

      <FormField id="previous-school" label="Previous school" error={errors.previousSchool}>
        <TextInput
          {...controlProps("previous-school", errors.previousSchool)}
          value={value.previousSchool ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ previousSchool: event.target.value })}
        />
      </FormField>
    </div>
  );
}
