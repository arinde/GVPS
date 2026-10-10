"use client";

import { useState } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { NativeSelect } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";
import { DAY_LABELS, DAYS, type AvailableSubject, type DayOfWeek } from "@/store/api/timetable-api";

export type SubjectLoadDraft = { periodsPerWeek: number; fixedDay: DayOfWeek | null };

export type SubjectLoadEditorProps = {
  subjects: AvailableSubject[];
  saving: boolean;
  generating: boolean;
  onSave: (rows: { subjectId: string; draft: SubjectLoadDraft }[]) => void;
  onGenerate: () => void;
};

const DAY_OPTIONS = [
  { value: "", label: "Spread across the week" },
  ...DAYS.map((day) => ({ value: day, label: `Only ${DAY_LABELS[day]}` })),
];

/**
 * FEATURES.md §8.1 — what a teacher (their own class) or the admin office
 * inputs: not the grid itself, but each subject's weekly load. The timetable
 * is then built from this, not placed one cell at a time.
 */
export function SubjectLoadEditor({ subjects, saving, generating, onSave, onGenerate }: SubjectLoadEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, SubjectLoadDraft>>(() =>
    Object.fromEntries(subjects.map((s) => [s.subjectId, { periodsPerWeek: s.periodsPerWeek, fixedDay: s.fixedDay }])),
  );
  const [confirmingGenerate, setConfirmingGenerate] = useState(false);

  function patch(subjectId: string, change: Partial<SubjectLoadDraft>) {
    setDrafts((current) => ({ ...current, [subjectId]: { ...current[subjectId], ...change } }));
  }

  function save() {
    onSave(subjects.map((subject) => ({ subjectId: subject.subjectId, draft: drafts[subject.subjectId] })));
  }

  if (subjects.length === 0) {
    return (
      <ContentCard>
        <h2 className="mb-2 text-base">Subjects for this class</h2>
        <p className="text-muted-foreground text-sm">
          No subject has a teacher assigned to this class yet. Assign one under Subject assignments first.
        </p>
      </ContentCard>
    );
  }

  return (
    <ContentCard>
      <h2 className="mb-1 text-base">Subjects for this class</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        How many periods a week each subject needs, and whether it&apos;s pinned to one day — Sports every Wednesday,
        for example. The timetable below is built from this.
      </p>
      <div className="flex flex-col gap-3">
        {subjects.map((subject) => {
          const draft = drafts[subject.subjectId];
          return (
            <div
              key={subject.subjectId}
              className="flex flex-wrap items-end gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-40">
                <p className="font-medium">{subject.subjectName}</p>
                <p className="text-muted-foreground text-xs">{subject.staffName}</p>
              </div>
              <TextInput
                aria-label={`${subject.subjectName} periods per week`}
                type="number"
                min={1}
                max={20}
                value={String(draft.periodsPerWeek)}
                onChange={(event) => patch(subject.subjectId, { periodsPerWeek: Number(event.target.value) || 1 })}
                className="w-20"
              />
              <NativeSelect
                aria-label={`${subject.subjectName} fixed day`}
                value={draft.fixedDay ?? ""}
                onChange={(event) =>
                  patch(subject.subjectId, { fixedDay: (event.target.value || null) as DayOfWeek | null })
                }
                options={DAY_OPTIONS}
                className="w-48"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <AppButton type="button" variant="secondary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save subject list"}
        </AppButton>

        {confirmingGenerate ? (
          <>
            <span className="text-muted-foreground text-xs">Replaces this class&apos;s current timetable. Sure?</span>
            <AppButton
              type="button"
              variant="danger"
              onClick={() => {
                setConfirmingGenerate(false);
                onGenerate();
              }}
              disabled={generating}
            >
              {generating ? "Generating…" : "Yes, generate"}
            </AppButton>
            <AppButton type="button" variant="ghost" onClick={() => setConfirmingGenerate(false)}>
              Cancel
            </AppButton>
          </>
        ) : (
          <AppButton type="button" onClick={() => setConfirmingGenerate(true)} disabled={generating}>
            Generate timetable
          </AppButton>
        )}
      </div>
    </ContentCard>
  );
}
