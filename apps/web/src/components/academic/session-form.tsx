import type { FormEvent } from "react";
import { CalendarPlus } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { FormField, controlProps } from "@/components/common/form-field";
import { TextInput } from "@/components/common/text-input";
import type { CreateSessionRequest } from "@/store/api/academic-api";

export type SessionFormProps = {
  value: CreateSessionRequest;
  onChange: (patch: Partial<CreateSessionRequest>) => void;
  onSubmit: () => void;
  errors?: Record<string, string>;
  isSubmitting?: boolean;
};

const NAME_HINT = "Two years, e.g. 2027/2028";

/** Starts a school year. Its terms are added afterwards, one at a time. Presentational. */
export function SessionForm({ value, onChange, onSubmit, errors = {}, isSubmitting = false }: SessionFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <FormField id="session-name" label="Session" required hint={NAME_HINT} error={errors.name}>
        <TextInput
          {...controlProps("session-name", errors.name, NAME_HINT)}
          value={value.name}
          placeholder="2027/2028"
          disabled={isSubmitting}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </FormField>

      <FormField id="session-start" label="First day" required error={errors.startDate}>
        <TextInput
          {...controlProps("session-start", errors.startDate)}
          type="date"
          value={value.startDate}
          disabled={isSubmitting}
          onChange={(event) => onChange({ startDate: event.target.value })}
        />
      </FormField>

      <FormField id="session-end" label="Last day" required error={errors.endDate}>
        <TextInput
          {...controlProps("session-end", errors.endDate)}
          type="date"
          value={value.endDate}
          disabled={isSubmitting}
          onChange={(event) => onChange({ endDate: event.target.value })}
        />
      </FormField>

      <div className="flex flex-col gap-1.5">
        <span aria-hidden="true" className="hidden h-5 sm:block" />
        <AppButton type="submit" disabled={isSubmitting || !value.name.trim() || !value.startDate || !value.endDate}>
          <CalendarPlus aria-hidden="true" />
          {isSubmitting ? "Creating…" : "Create session"}
        </AppButton>
      </div>
    </form>
  );
}
