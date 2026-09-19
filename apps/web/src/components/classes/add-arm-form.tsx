import type { FormEvent } from "react";
import { Plus } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect, type SelectOption } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";

export type AddArmDraft = { levelId: string; name: string; capacity: string };

export type AddArmFormProps = {
  levels: SelectOption[];
  value: AddArmDraft;
  onChange: (patch: Partial<AddArmDraft>) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  /** Keyed by field: "levelId", "name", "capacity". */
  errors?: Record<string, string>;
};

/** Presentational (AGENTS.md §1): adds one arm, e.g. Primary 1B, to a level. */
export function AddArmForm({ levels, value, onChange, onSubmit, isSubmitting = false, errors = {} }: AddArmFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-4 sm:grid-cols-[1fr_120px_140px_auto]">
      <FormField id="arm-level" label="Class level" required error={errors.levelId}>
        <NativeSelect
          {...controlProps("arm-level", errors.levelId)}
          options={levels}
          placeholder="Choose a level…"
          value={value.levelId}
          disabled={isSubmitting}
          onChange={(event) => onChange({ levelId: event.target.value })}
        />
      </FormField>

      <FormField id="arm-name" label="Arm" required hint="A letter, e.g. B" error={errors.name}>
        <TextInput
          {...controlProps("arm-name", errors.name, "A letter, e.g. B")}
          value={value.name}
          maxLength={20}
          autoCapitalize="characters"
          disabled={isSubmitting || !value.levelId}
          onChange={(event) => onChange({ name: event.target.value.toUpperCase() })}
        />
      </FormField>

      <FormField id="arm-capacity" label="Class size" hint="Optional" error={errors.capacity}>
        <TextInput
          {...controlProps("arm-capacity", errors.capacity, "Optional")}
          type="number"
          inputMode="numeric"
          min={1}
          max={200}
          value={value.capacity}
          disabled={isSubmitting || !value.levelId}
          onChange={(event) => onChange({ capacity: event.target.value })}
        />
      </FormField>

      {/* Label-height spacer keeps the button level with the inputs on desktop. */}
      <div className="flex flex-col gap-1.5">
        <span aria-hidden="true" className="hidden h-5 sm:block" />
        <AppButton type="submit" disabled={isSubmitting || !value.levelId || !value.name.trim()}>
          <Plus aria-hidden="true" />
          {isSubmitting ? "Adding…" : "Add class"}
        </AppButton>
      </div>
    </form>
  );
}
