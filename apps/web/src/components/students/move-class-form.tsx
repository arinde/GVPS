import type { FormEvent } from "react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";
import type { Department } from "@/store/api/subjects-api";

export type MoveClassDraft = { classArmId: string; stream: Department | ""; reason: string };

export type MoveClassFormProps = {
  classes: SelectOption[];
  departments: SelectOption[];
  value: MoveClassDraft;
  /** True when the chosen class is senior and has no department of its own. */
  needsDepartment: boolean;
  onChange: (patch: Partial<MoveClassDraft>) => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
};

/** Moves a student to another class in the session they are already in. Presentational. */
export function MoveClassForm({
  classes,
  departments,
  value,
  needsDepartment,
  onChange,
  onSubmit,
  errors = {},
  isSubmitting = false,
}: MoveClassFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="move-class" label="New class" required error={errors.classArmId}>
          <NativeSelect
            {...controlProps("move-class", errors.classArmId)}
            placeholder="Choose a class…"
            options={classes}
            value={value.classArmId}
            disabled={isSubmitting}
            onChange={(event) => onChange({ classArmId: event.target.value })}
          />
        </FormField>

        {needsDepartment ? (
          <FormField id="move-department" label="Department" required error={errors.stream}>
            <NativeSelect
              {...controlProps("move-department", errors.stream)}
              placeholder="Choose a department…"
              options={departments}
              value={value.stream}
              disabled={isSubmitting}
              onChange={(event) => onChange({ stream: event.target.value as Department | "" })}
            />
          </FormField>
        ) : null}

        <FormField id="move-reason" label="Reason" hint="Optional — kept in the audit log" error={errors.reason}>
          <TextInput
            {...controlProps("move-reason", errors.reason, "Optional — kept in the audit log")}
            value={value.reason}
            disabled={isSubmitting}
            onChange={(event) => onChange({ reason: event.target.value })}
          />
        </FormField>
      </div>

      <div className="flex flex-col items-start gap-1">
        <AppButton type="submit" variant="secondary" disabled={isSubmitting || !value.classArmId}>
          {isSubmitting ? "Moving…" : "Move to this class"}
        </AppButton>
        {!value.classArmId ? <p className="text-muted-foreground text-xs">Choose the new class first.</p> : null}
      </div>
    </form>
  );
}
