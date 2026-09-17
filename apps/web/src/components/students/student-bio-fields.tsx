import { FormField } from "@/components/common/form-field";
import { Input } from "@/components/ui/input";
import type { ClassArmOption } from "@/store/api/academic-api";
import type { RegisterStudentRequest } from "@/store/api/students-api";

const SELECT_CLASS = "border-input bg-card h-9 rounded-md border px-3 text-sm";

export type StudentBioFieldsProps = {
  value: RegisterStudentRequest;
  arms: ClassArmOption[];
  onChange: (patch: Partial<RegisterStudentRequest>) => void;
};

/** The student's own details. Guardians are a separate responsibility. */
export function StudentBioFields({ value, arms, onChange }: StudentBioFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField id="first-name" label="First name" required>
        <Input
          id="first-name"
          autoFocus
          value={value.firstName}
          onChange={(event) => onChange({ firstName: event.target.value })}
        />
      </FormField>

      <FormField id="last-name" label="Surname" required>
        <Input id="last-name" value={value.lastName} onChange={(event) => onChange({ lastName: event.target.value })} />
      </FormField>

      <FormField id="other-names" label="Other names" className="sm:col-span-2">
        <Input
          id="other-names"
          value={value.otherNames ?? ""}
          onChange={(event) => onChange({ otherNames: event.target.value })}
        />
      </FormField>

      <FormField id="dob" label="Date of birth" required>
        <Input
          id="dob"
          type="date"
          value={value.dateOfBirth}
          onChange={(event) => onChange({ dateOfBirth: event.target.value })}
        />
      </FormField>

      <FormField id="sex" label="Sex" required>
        <select
          id="sex"
          className={SELECT_CLASS}
          value={value.sex}
          onChange={(event) => onChange({ sex: event.target.value as RegisterStudentRequest["sex"] })}
        >
          <option value="FEMALE">Female</option>
          <option value="MALE">Male</option>
        </select>
      </FormField>

      <FormField id="class-arm" label="Class" required hint="Sets the level and this session's enrolment">
        <select
          id="class-arm"
          className={SELECT_CLASS}
          value={value.classArmId}
          onChange={(event) => onChange({ classArmId: event.target.value })}
        >
          <option value="">Select a class…</option>
          {arms.map((arm) => (
            <option key={arm.id} value={arm.id}>
              {arm.classLevel.name}
              {arm.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="admission-date" label="Date of admission" required>
        <Input
          id="admission-date"
          type="date"
          value={value.dateOfAdmission}
          onChange={(event) => onChange({ dateOfAdmission: event.target.value })}
        />
      </FormField>

      <FormField id="state" label="State of origin">
        <Input
          id="state"
          value={value.stateOfOrigin ?? ""}
          onChange={(event) => onChange({ stateOfOrigin: event.target.value })}
        />
      </FormField>

      <FormField id="lga" label="LGA">
        <Input id="lga" value={value.lga ?? ""} onChange={(event) => onChange({ lga: event.target.value })} />
      </FormField>

      <FormField id="address" label="Address" className="sm:col-span-2">
        <Input
          id="address"
          value={value.address ?? ""}
          onChange={(event) => onChange({ address: event.target.value })}
        />
      </FormField>

      <FormField id="blood-group" label="Blood group" hint="School clinic record">
        <Input
          id="blood-group"
          value={value.bloodGroup ?? ""}
          onChange={(event) => onChange({ bloodGroup: event.target.value })}
        />
      </FormField>

      <FormField id="previous-school" label="Previous school">
        <Input
          id="previous-school"
          value={value.previousSchool ?? ""}
          onChange={(event) => onChange({ previousSchool: event.target.value })}
        />
      </FormField>

      <FormField id="medical-note" label="Standing medical note" className="sm:col-span-2">
        <Input
          id="medical-note"
          value={value.medicalNote ?? ""}
          onChange={(event) => onChange({ medicalNote: event.target.value })}
        />
      </FormField>
    </div>
  );
}
