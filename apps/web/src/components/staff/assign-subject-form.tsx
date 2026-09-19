import type { FormEvent } from "react";
import { BookPlus } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { CheckboxGroup, type CheckboxOption } from "@/components/common/checkbox-group";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";

export type AssignSubjectFormProps = {
  subjects: SelectOption[];
  subjectId: string;
  onSubjectChange: (subjectId: string) => void;
  /** Classes whose level offers the chosen subject; hints name whoever teaches it there now. */
  classes: CheckboxOption[];
  classArmIds: string[];
  onToggleClass: (classArmId: string, checked: boolean) => void;
  onSubmit: () => void;
  isLoadingClasses?: boolean;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
};

/**
 * Give a teacher one subject in several classes. The class list appears once
 * a subject is chosen, limited to classes that offer it. Presentational.
 */
export function AssignSubjectForm({
  subjects,
  subjectId,
  onSubjectChange,
  classes,
  classArmIds,
  onToggleClass,
  onSubmit,
  isLoadingClasses = false,
  isSubmitting = false,
  errors = {},
}: AssignSubjectFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <FormField id="assign-subject" label="Subject" required error={errors.subjectId}>
        <NativeSelect
          {...controlProps("assign-subject", errors.subjectId)}
          placeholder="Choose a subject…"
          options={subjects}
          value={subjectId}
          disabled={isSubmitting}
          onChange={(event) => onSubjectChange(event.target.value)}
        />
      </FormField>

      {subjectId ? (
        isLoadingClasses ? (
          <p className="text-muted-foreground text-sm" role="status">
            Loading classes…
          </p>
        ) : classes.length ? (
          <CheckboxGroup
            id="assign-class"
            legend="Classes they will teach it in"
            options={classes}
            selected={classArmIds}
            onToggle={onToggleClass}
            error={errors.classArmIds}
            disabled={isSubmitting}
            columns={3}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            This subject is not offered at any level yet. Choose its levels under Subjects first.
          </p>
        )
      ) : null}

      <AppButton type="submit" className="self-start" disabled={isSubmitting || !subjectId || classArmIds.length === 0}>
        <BookPlus aria-hidden="true" />
        {isSubmitting ? "Assigning…" : "Assign subject"}
      </AppButton>
    </form>
  );
}
