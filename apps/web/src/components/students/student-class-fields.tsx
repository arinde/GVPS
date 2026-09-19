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

export type StudentClassFieldsProps = StudentFieldProps<RegisterStudentRequest> & { arms: ClassArmOption[] };

// Far enough back to enter a senior student admitted into Creche.
const YEARS_BACK = 20;

function admissionYearOptions(thisYear = new Date().getFullYear()) {
  return Array.from({ length: YEARS_BACK + 1 }, (_, index) => {
    const year = String(thisYear - index);
    return { value: year, label: year };
  });
}

/**
 * Where the student is placed: class, department and year of admission. The
 * year sets the admission number's year (GVPS/PRY/2024/…), so a student who
 * joined in 2024 and is only now being entered still gets a 2024 number.
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

      <FormField
        id="admission-year"
        label="Year of admission"
        required
        hint="The year they joined the school. It goes into the admission number."
        error={errors.admissionYear}
      >
        <NativeSelect
          {...controlProps(
            "admission-year",
            errors.admissionYear,
            "The year they joined the school. It goes into the admission number.",
          )}
          options={admissionYearOptions()}
          value={String(value.admissionYear)}
          disabled={disabled}
          onChange={(event) => onChange({ admissionYear: Number(event.target.value) })}
        />
      </FormField>

      <FormField
        id="admission-date"
        label="Exact date of admission"
        hint="Optional, if known"
        error={errors.dateOfAdmission}
      >
        <TextInput
          {...controlProps("admission-date", errors.dateOfAdmission, "Optional, if known")}
          type="date"
          min={`${value.admissionYear}-01-01`}
          max={`${value.admissionYear}-12-31`}
          value={value.dateOfAdmission ?? ""}
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
