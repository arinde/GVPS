import { useState } from "react";
import { scoreGridColumns, type ScoreRow } from "@/components/assessment/score-grid-columns";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { notify } from "@/lib/notify";
import { useGetGradingScaleQuery, type GradeBand } from "@/store/api/assessment-api";
import { useSaveScoreBatchMutation, type ScoreGrid } from "@/store/api/score-entry-api";

type RowState = { draft: Record<string, string>; errors: Record<string, string>; isSaving: boolean };

function initRows(grid: ScoreGrid): Record<string, RowState> {
  const byStudent: Record<string, Record<string, number>> = {};
  for (const score of grid.scores) {
    (byStudent[score.studentId] ??= {})[score.assessmentComponentId] = score.value;
  }

  return Object.fromEntries(
    grid.students.map((student) => {
      const values = byStudent[student.id] ?? {};
      const draft = Object.fromEntries(grid.components.map((c) => [c.id, values[c.id]?.toString() ?? ""]));
      return [student.id, { draft, errors: {}, isSaving: false }];
    }),
  );
}

/** The band whose range a total falls in — null while bands aren't loaded yet, or the total is still incomplete. */
function gradeFor(total: number, bands: GradeBand[]): GradeBand | null {
  return bands.find((band) => total >= band.minScore && total <= band.maxScore) ?? null;
}

export type ScoreEntryTableProps = {
  grid: ScoreGrid;
  section: string;
  termId: string;
  subjectId: string;
  classArmId: string;
};

/**
 * Explicit, visible saving: a Save button per row rather than saving silently
 * on blur, because a teacher filling in a grid has no other way to know a
 * value actually landed (AGENTS.md §12 — build for whoever is least sure what
 * just happened, not whoever is most confident). Keyed by the caller on
 * (term, subject, class), so switching the selection remounts this with a
 * fresh initial draft rather than needing an effect to reset it.
 *
 * Total and grade are a live preview only — computed here from whatever is
 * currently typed, components included or not. The real, frozen computation
 * (FEATURES.md §5.5) runs at approval, once that workflow exists.
 */
export function ScoreEntryTable({ grid, section, termId, subjectId, classArmId }: ScoreEntryTableProps) {
  const [rows, setRows] = useState<Record<string, RowState>>(() => initRows(grid));
  const [saveBatch] = useSaveScoreBatchMutation();
  const { data: gradingScale } = useGetGradingScaleQuery(section);

  const maxTotal = grid.components.reduce((sum, component) => sum + component.maxScore, 0);

  function setValue(studentId: string, componentId: string, text: string) {
    setRows((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        draft: { ...current[studentId].draft, [componentId]: text },
        // Clears only this field's error as soon as it's edited, not the whole row's (AGENTS.md §12).
        errors: { ...current[studentId].errors, [componentId]: "" },
      },
    }));
  }

  function validate(studentId: string): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const component of grid.components) {
      const text = rows[studentId].draft[component.id]?.trim() ?? "";
      if (text === "") continue; // Not every component has to be filled in yet.
      const value = Number(text);
      if (!Number.isInteger(value) || value < 0 || value > component.maxScore) {
        errors[component.id] = `0–${component.maxScore}`;
      }
    }
    return errors;
  }

  async function saveRow(studentId: string) {
    const student = grid.students.find((candidate) => candidate.id === studentId);
    if (!student) return;
    const name = `${student.firstName} ${student.lastName}`;

    const errors = validate(studentId);
    if (Object.keys(errors).length > 0) {
      setRows((current) => ({ ...current, [studentId]: { ...current[studentId], errors } }));
      notify.warning("Please correct the highlighted fields.", { description: `${name}'s scores were not saved.` });
      return;
    }

    const draft = rows[studentId].draft;
    const scores = grid.components
      .filter((component) => draft[component.id]?.trim() !== "")
      .map((component) => ({ studentId, assessmentComponentId: component.id, value: Number(draft[component.id]) }));

    if (scores.length === 0) {
      notify.info("Nothing to save yet", { description: `Enter at least one score for ${name} first.` });
      return;
    }

    setRows((current) => ({ ...current, [studentId]: { ...current[studentId], isSaving: true } }));
    try {
      const results = await saveBatch({ termId, subjectId, classArmId, scores }).unwrap();
      const failed = results.filter((result) => !result.ok);

      if (failed.length > 0) {
        const failedErrors = Object.fromEntries(
          failed.map((f) => [f.assessmentComponentId, f.error ?? "Could not save"]),
        );
        setRows((current) => ({
          ...current,
          [studentId]: { ...current[studentId], isSaving: false, errors: failedErrors },
        }));
        notify.warning("Please correct the highlighted fields.", {
          description: `Some of ${name}'s scores were not saved.`,
        });
        return;
      }

      setRows((current) => ({ ...current, [studentId]: { ...current[studentId], isSaving: false } }));
      notify.success(`${name}'s scores saved`);
    } catch (error) {
      setRows((current) => ({ ...current, [studentId]: { ...current[studentId], isSaving: false } }));
      notify.error(error, `Could not save ${name}'s scores.`);
    }
  }

  const tableRows: ScoreRow[] = grid.students.map((student) => {
    const draft = rows[student.id].draft;
    const filled = grid.components.filter((component) => draft[component.id]?.trim() !== "");
    const total = filled.reduce((sum, component) => sum + Number(draft[component.id]), 0);
    const isComplete = filled.length === grid.components.length;
    const grade = isComplete && gradingScale ? gradeFor(total, gradingScale.bands) : null;
    const isPass = isComplete && gradingScale ? total >= gradingScale.passMark : null;

    return { student, ...rows[student.id], total, maxTotal, isComplete, grade, isPass };
  });

  const columns = scoreGridColumns({ components: grid.components, onValueChange: setValue, onSaveRow: saveRow });

  return (
    <ContentCard flush>
      <DataTable
        columns={columns}
        data={tableRows}
        emptyTitle="No students enrolled"
        emptyDescription="This class has no active students yet."
      />
    </ContentCard>
  );
}
