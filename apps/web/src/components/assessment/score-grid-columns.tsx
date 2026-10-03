import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { AppButton } from "@/components/common/app-button";
import { StatusPill } from "@/components/common/status-pill";
import { TextInput } from "@/components/common/text-input";
import type { GradeBand } from "@/store/api/assessment-api";
import type { ScoreComponent, ScoreStudent } from "@/store/api/score-entry-api";

export type ScoreRow = {
  student: ScoreStudent;
  /** This row's currently-typed values, keyed by componentId — what's shown and what Save submits. */
  draft: Record<string, string>;
  /** Validation message per componentId, shown inline; Save refuses to submit while any exist. */
  errors: Record<string, string>;
  isSaving: boolean;
  /** Live preview only — the sum of whatever is currently typed, complete or not. */
  total: number;
  maxTotal: number;
  isComplete: boolean;
  grade: GradeBand | null;
  isPass: boolean | null;
};

export type ScoreGridColumnsOptions = {
  components: ScoreComponent[];
  onValueChange: (studentId: string, componentId: string, text: string) => void;
  onSaveRow: (studentId: string) => void;
};

const helper = createColumnHelper<StockFeatures, ScoreRow>();

export function scoreGridColumns({ components, onValueChange, onSaveRow }: ScoreGridColumnsOptions) {
  const studentColumn = helper.display({
    id: "student",
    header: "Student",
    cell: ({ row }) => (
      <div>
        <div className="text-foreground font-medium">
          {row.original.student.lastName}, {row.original.student.firstName}
        </div>
        <div className="text-muted-foreground text-xs">{row.original.student.admissionNo}</div>
      </div>
    ),
  });

  const componentColumns = components.map((component) =>
    helper.display({
      id: component.id,
      header: `${component.name} (${component.maxScore})`,
      cell: ({ row }) => {
        const error = row.original.errors[component.id];
        const inputId = `score-${row.original.student.id}-${component.id}`;
        return (
          <div className="flex flex-col gap-1">
            <TextInput
              id={inputId}
              aria-label={`${component.name} for ${row.original.student.firstName} ${row.original.student.lastName}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${inputId}-error` : undefined}
              type="number"
              inputMode="numeric"
              min={0}
              max={component.maxScore}
              placeholder="—"
              value={row.original.draft[component.id] ?? ""}
              disabled={row.original.isSaving}
              className="w-20"
              onChange={(event) => onValueChange(row.original.student.id, component.id, event.target.value)}
            />
            {error ? (
              <p id={`${inputId}-error`} role="alert" className="text-destructive text-xs">
                {error}
              </p>
            ) : null}
          </div>
        );
      },
    }),
  );

  // Live preview only — not the frozen computation FEATURES.md §5.5 runs at approval.
  const totalColumn = helper.display({
    id: "total",
    header: "Total",
    cell: ({ row }) => {
      const hasAnyValue = Object.values(row.original.draft).some((text) => text.trim() !== "");
      if (!hasAnyValue) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <span className="text-foreground text-sm font-semibold">
          {row.original.total}
          <span className="text-muted-foreground font-normal">/{row.original.maxTotal}</span>
        </span>
      );
    },
  });

  const gradeColumn = helper.display({
    id: "grade",
    header: "Grade",
    cell: ({ row }) => {
      const hasAnyValue = Object.values(row.original.draft).some((text) => text.trim() !== "");
      if (!hasAnyValue) return <span className="text-muted-foreground text-sm">—</span>;
      if (!row.original.isComplete) {
        return <span className="text-muted-foreground text-xs">Incomplete</span>;
      }
      if (!row.original.grade) return <span className="text-muted-foreground text-sm">—</span>;

      const passed = row.original.isPass ?? false;
      return (
        <StatusPill tone={passed ? "success" : "danger"} shape={passed ? "circle" : "square"}>
          {`${row.original.grade.letter} — ${row.original.grade.descriptor}`}
        </StatusPill>
      );
    },
  });

  const saveColumn = helper.display({
    id: "save",
    header: "",
    cell: ({ row }) => (
      <AppButton
        type="button"
        size="small"
        variant="secondary"
        disabled={row.original.isSaving}
        onClick={() => onSaveRow(row.original.student.id)}
      >
        {row.original.isSaving ? "Saving…" : "Save"}
      </AppButton>
    ),
  });

  return [studentColumn, ...componentColumns, totalColumn, gradeColumn, saveColumn] as ColumnDef<
    StockFeatures,
    ScoreRow,
    unknown
  >[];
}
