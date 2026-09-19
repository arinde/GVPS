import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { CheckboxGroup } from "@/components/common/checkbox-group";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { DEPARTMENT_OPTIONS, SECTION_LABEL } from "@/components/subjects/subject-labels";
import type { Department } from "@/store/api/subjects-api";

type Level = { id: string; name: string; section: keyof typeof SECTION_LABEL };

export type OfferLevelsDraft = { classLevelIds: string[]; stream: Department | ""; isCore: boolean };

export type OfferLevelsFormProps = {
  levels: Level[];
  value: OfferLevelsDraft;
  onToggleLevel: (levelId: string, checked: boolean) => void;
  onSelectSection: (levelIds: string[]) => void;
  onChange: (patch: Partial<Pick<OfferLevelsDraft, "stream" | "isCore">>) => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
};

const TYPE_OPTIONS = [
  { value: "core", label: "Core — every student takes it" },
  { value: "elective", label: "Elective — students may choose it" },
];

/**
 * Choose the levels that take a subject, grouped by stage, with one tap to
 * take a whole stage. A department is asked for only when every chosen level
 * is senior, since only SSS has departments. Presentational.
 */
export function OfferLevelsForm({
  levels,
  value,
  onToggleLevel,
  onSelectSection,
  onChange,
  onSubmit,
  errors = {},
  isSubmitting = false,
}: OfferLevelsFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const chosen = levels.filter((level) => value.classLevelIds.includes(level.id));
  const allSenior = chosen.length > 0 && chosen.every((level) => level.section === "SENIOR");
  const sections = (Object.keys(SECTION_LABEL) as Level["section"][])
    .map((section) => ({ section, levels: levels.filter((level) => level.section === section) }))
    .filter((group) => group.levels.length > 0);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((group) => (
          <div key={group.section} className="flex flex-col gap-2">
            <CheckboxGroup
              id={`offer-${group.section}`}
              legend={SECTION_LABEL[group.section]}
              options={group.levels.map((level) => ({ value: level.id, label: level.name }))}
              selected={value.classLevelIds}
              onToggle={onToggleLevel}
              disabled={isSubmitting}
            />
            <AppButton
              type="button"
              variant="ghost"
              size="small"
              className="self-start"
              disabled={isSubmitting}
              onClick={() => onSelectSection(group.levels.map((level) => level.id))}
            >
              Select all {SECTION_LABEL[group.section].toLowerCase()}
            </AppButton>
          </div>
        ))}
      </div>
      {errors.classLevelIds ? (
        <p role="alert" className="text-destructive text-xs">
          {errors.classLevelIds}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="offer-type" label="Type">
          <NativeSelect
            {...controlProps("offer-type")}
            options={TYPE_OPTIONS}
            value={value.isCore ? "core" : "elective"}
            disabled={isSubmitting}
            onChange={(event) => onChange({ isCore: event.target.value === "core" })}
          />
        </FormField>
        {allSenior ? (
          <FormField
            id="offer-department"
            label="Department"
            hint="Leave as all for every department"
            error={errors.stream}
          >
            <NativeSelect
              {...controlProps("offer-department", errors.stream, "Leave as all for every department")}
              placeholder="All departments"
              options={DEPARTMENT_OPTIONS}
              value={value.stream}
              disabled={isSubmitting}
              onChange={(event) => onChange({ stream: event.target.value as Department | "" })}
            />
          </FormField>
        ) : null}
      </div>

      <AppButton type="submit" className="self-start" disabled={isSubmitting || chosen.length === 0}>
        <Plus aria-hidden="true" />
        {isSubmitting ? "Adding…" : `Offer at ${chosen.length || "the chosen"} level${chosen.length === 1 ? "" : "s"}`}
      </AppButton>
    </form>
  );
}
