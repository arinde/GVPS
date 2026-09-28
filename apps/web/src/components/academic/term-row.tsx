import { StatusPill } from "@/components/common/status-pill";
import { AppButton } from "@/components/common/app-button";
import { TextInput } from "@/components/common/text-input";
import { formatDate } from "@/lib/dates";
import type { Term } from "@/store/api/academic-api";

export type TermRowProps = {
  term: Term;
  onMakeCurrent: (term: Term) => void;
  /** Saved on blur or Enter, only when the number changed. */
  onTimesOpenedCommit: (term: Term, text: string) => void;
  busy?: boolean;
};

/** One term: its dates, whether it is the current one, and the days the school opened. */
export function TermRow({ term, onMakeCurrent, onTimesOpenedCommit, busy = false }: TermRowProps) {
  const saved = term.timesSchoolOpened?.toString() ?? "";

  return (
    <li className="border-border flex flex-wrap items-center gap-3 border-b py-3 last:border-b-0">
      <div className="min-w-44 flex-1">
        <p className="text-foreground text-sm font-medium">{term.name}</p>
        <p className="text-muted-foreground text-xs">
          {formatDate(term.startDate)} – {formatDate(term.endDate)}
        </p>
      </div>

      <label className="text-muted-foreground flex items-center gap-2 text-xs">
        Days opened
        <TextInput
          // Keyed on the saved value so a refetch resets the field to it.
          key={saved}
          aria-label={`Days the school opened in ${term.name}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={300}
          className="w-24"
          placeholder="—"
          defaultValue={saved}
          disabled={busy}
          onBlur={(event) => {
            if (event.target.value.trim() !== saved) onTimesOpenedCommit(term, event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </label>

      {term.isCurrent ? (
        <StatusPill tone="success" shape="circle">
          Current term
        </StatusPill>
      ) : (
        <AppButton variant="secondary" size="small" disabled={busy} onClick={() => onMakeCurrent(term)}>
          Make current
        </AppButton>
      )}
    </li>
  );
}
