import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";

export type AssignWholeClassFormProps = {
  classes: SelectOption[];
  classArmId: string;
  onChange: (classArmId: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

/**
 * FEATURES.md §2.4's primary model: one teacher takes every subject offered
 * to a class, in a single action. Presentational.
 */
export function AssignWholeClassForm({
  classes,
  classArmId,
  onChange,
  onSubmit,
  isSubmitting = false,
}: AssignWholeClassFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Class teacher: every subject in one class</h3>
      <p className="text-muted-foreground text-xs">For primary classes, where one teacher takes all subjects.</p>
      <div className="flex flex-wrap items-end gap-3">
        <FormField id="whole-class" label="Class" className="min-w-48">
          <NativeSelect
            {...controlProps("whole-class")}
            placeholder="Choose a class…"
            options={classes}
            value={classArmId}
            disabled={isSubmitting}
            onChange={(event) => onChange(event.target.value)}
          />
        </FormField>
        <AppButton variant="secondary" onClick={onSubmit} disabled={!classArmId || isSubmitting}>
          {isSubmitting ? "Assigning…" : "Assign all subjects"}
        </AppButton>
      </div>
    </div>
  );
}
