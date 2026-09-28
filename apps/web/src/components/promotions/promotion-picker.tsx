import { CheckboxGroup } from "@/components/common/checkbox-group";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";
import type { PromotionCandidate } from "@/store/api/promotions-api";
import type { Department } from "@/store/api/subjects-api";

export type PromotionPickerProps = {
  classes: SelectOption[];
  sessions: SelectOption[];
  departments: SelectOption[];
  fromClassArmId: string;
  toSessionId: string;
  toClassArmId: string;
  stream: Department | "";
  /** Shown once a source class is chosen; empty means nobody is enrolled there. */
  students: PromotionCandidate[];
  studentIds: string[];
  /** True when the destination is a senior class with no department of its own. */
  needsDepartment: boolean;
  onChange: (patch: {
    fromClassArmId?: string;
    toSessionId?: string;
    toClassArmId?: string;
    stream?: Department | "";
  }) => void;
  onToggleStudent: (studentId: string, checked: boolean) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
};

/** The choices a promotion needs: which class moves, where to, and who goes. Presentational. */
export function PromotionPicker({
  classes,
  sessions,
  departments,
  fromClassArmId,
  toSessionId,
  toClassArmId,
  stream,
  students,
  studentIds,
  needsDepartment,
  onChange,
  onToggleStudent,
  errors = {},
  disabled = false,
}: PromotionPickerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField id="from-class" label="Class to promote" required error={errors.fromClassArmId}>
          <NativeSelect
            {...controlProps("from-class", errors.fromClassArmId)}
            placeholder="Choose a class…"
            options={classes}
            value={fromClassArmId}
            disabled={disabled}
            onChange={(event) => onChange({ fromClassArmId: event.target.value })}
          />
        </FormField>

        <FormField id="to-session" label="Into session" required error={errors.toSessionId}>
          <NativeSelect
            {...controlProps("to-session", errors.toSessionId)}
            placeholder="Choose a session…"
            options={sessions}
            value={toSessionId}
            disabled={disabled}
            onChange={(event) => onChange({ toSessionId: event.target.value })}
          />
        </FormField>

        <FormField
          id="to-class"
          label="Into class"
          required
          hint="The same class means repeating the year"
          error={errors.toClassArmId}
        >
          <NativeSelect
            {...controlProps("to-class", errors.toClassArmId, "The same class means repeating the year")}
            placeholder="Choose a class…"
            options={classes}
            value={toClassArmId}
            disabled={disabled}
            onChange={(event) => onChange({ toClassArmId: event.target.value })}
          />
        </FormField>

        {needsDepartment ? (
          <FormField id="to-department" label="Department" required error={errors.stream}>
            <NativeSelect
              {...controlProps("to-department", errors.stream)}
              placeholder="Choose a department…"
              options={departments}
              value={stream}
              disabled={disabled}
              onChange={(event) => onChange({ stream: event.target.value as Department | "" })}
            />
          </FormField>
        ) : null}
      </div>

      {fromClassArmId ? (
        students.length ? (
          <CheckboxGroup
            id="promote-student"
            legend={`Students moving (${studentIds.length} of ${students.length})`}
            options={students.map((student) => ({
              value: student.id,
              label: `${student.lastName}, ${student.firstName}`,
              hint: student.admissionNo,
            }))}
            selected={studentIds}
            onToggle={onToggleStudent}
            error={errors.studentIds}
            disabled={disabled}
            columns={3}
          />
        ) : (
          <p className="text-muted-foreground text-sm">Nobody is enrolled in that class this session.</p>
        )
      ) : null}
    </div>
  );
}
