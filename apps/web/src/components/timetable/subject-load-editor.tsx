"use client";

import { useState } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { NativeSelect } from "@/components/common/native-select";
import { TextInput } from "@/components/common/text-input";
import {
  DAY_LABELS,
  DAYS,
  type AddableSubject,
  type AvailableSubject,
  type DayOfWeek,
} from "@/store/api/timetable-api";

export type SubjectLoadDraft = { periodsPerWeek: number; fixedDay: DayOfWeek | null };

export type SubjectLoadEditorProps = {
  subjects: AvailableSubject[];
  addable: AddableSubject[];
  saving: boolean;
  generating: boolean;
  adding: boolean;
  removingSubjectId: string | null;
  onSave: (rows: { subjectId: string; draft: SubjectLoadDraft }[]) => void;
  onGenerate: () => void;
  onAdd: (subjectId: string) => void;
  onRemove: (subjectId: string) => void;
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
export function SubjectLoadEditor({
  subjects,
  addable,
  saving,
  generating,
  adding,
  removingSubjectId,
  onSave,
  onGenerate,
  onAdd,
  onRemove,
}: SubjectLoadEditorProps) {
  const [drafts, setDrafts] = useState<Record<string, SubjectLoadDraft>>({});
  const [confirmingGenerate, setConfirmingGenerate] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState("");

  // A subject just added (or never touched) has no draft yet — fall back to
  // what the server already has for it rather than syncing state with an effect.
  function draftFor(subject: AvailableSubject): SubjectLoadDraft {
    return drafts[subject.subjectId] ?? { periodsPerWeek: subject.periodsPerWeek, fixedDay: subject.fixedDay };
  }

  function patch(subjectId: string, current: SubjectLoadDraft, change: Partial<SubjectLoadDraft>) {
    setDrafts((drafts) => ({ ...drafts, [subjectId]: { ...current, ...change } }));
  }

  function save() {
    onSave(subjects.map((subject) => ({ subjectId: subject.subjectId, draft: draftFor(subject) })));
  }

  function addSubject() {
    if (!newSubjectId) return;
    onAdd(newSubjectId);
    setNewSubjectId("");
  }

  return (
    <ContentCard>
      <h2 className="mb-1 text-base">Subjects for this class</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        How many periods a week each subject needs, and whether it&apos;s pinned to one day — Sports every Wednesday,
        for example. The timetable below is built from this. A subject can be added before a teacher is assigned —
        it&apos;s simply left out until one is, and generating again picks it up.
      </p>

      {subjects.length === 0 ? (
        <p className="text-muted-foreground mb-4 text-sm">No subjects on this class&apos;s list yet.</p>
      ) : (
        <div className="mb-4 flex flex-col gap-3">
          {subjects.map((subject) => {
            const draft = draftFor(subject);
            return (
              <div
                key={subject.subjectId}
                className="flex flex-wrap items-end gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-40">
                  <p className="font-medium">{subject.subjectName}</p>
                  <p
                    className={subject.staffName ? "text-muted-foreground text-xs" : "text-warning-foreground text-xs"}
                  >
                    {subject.staffName ?? "No teacher assigned yet"}
                  </p>
                </div>
                <TextInput
                  aria-label={`${subject.subjectName} periods per week`}
                  type="number"
                  min={1}
                  max={20}
                  value={String(draft.periodsPerWeek)}
                  onChange={(event) =>
                    patch(subject.subjectId, draft, { periodsPerWeek: Number(event.target.value) || 1 })
                  }
                  className="w-20"
                />
                <NativeSelect
                  aria-label={`${subject.subjectName} fixed day`}
                  value={draft.fixedDay ?? ""}
                  onChange={(event) =>
                    patch(subject.subjectId, draft, { fixedDay: (event.target.value || null) as DayOfWeek | null })
                  }
                  options={DAY_OPTIONS}
                  className="w-48"
                />
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={() => onRemove(subject.subjectId)}
                  disabled={removingSubjectId === subject.subjectId}
                >
                  {removingSubjectId === subject.subjectId ? "Removing…" : "Remove"}
                </AppButton>
              </div>
            );
          })}
        </div>
      )}

      {addable.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-end gap-3 border-t pt-4">
          <NativeSelect
            aria-label="Add a subject"
            placeholder="Add a subject…"
            value={newSubjectId}
            onChange={(event) => setNewSubjectId(event.target.value)}
            options={addable.map((subject) => ({ value: subject.subjectId, label: subject.subjectName }))}
            className="max-w-xs"
          />
          <AppButton type="button" variant="secondary" onClick={addSubject} disabled={!newSubjectId || adding}>
            {adding ? "Adding…" : "Add subject"}
          </AppButton>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <AppButton type="button" variant="secondary" onClick={save} disabled={saving || subjects.length === 0}>
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
          <AppButton
            type="button"
            onClick={() => setConfirmingGenerate(true)}
            disabled={generating || subjects.length === 0}
          >
            Generate timetable
          </AppButton>
        )}
      </div>
    </ContentCard>
  );
}
