"use client";

import { useState } from "react";
import { AppButton, AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { SubjectLoadEditor, type SubjectLoadDraft } from "@/components/timetable/subject-load-editor";
import { notify } from "@/lib/notify";
import { printArmTimetable } from "@/lib/print-timetable";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import {
  DAY_LABELS,
  useAutoGenerateMutation,
  useClearSlotMutation,
  useGetArmGridQuery,
  useGetAvailableSubjectsQuery,
  useSetSlotMutation,
  useSetSubjectLoadMutation,
  type DayOfWeek,
  type Period,
} from "@/store/api/timetable-api";

type Cell = { day: DayOfWeek; period: Period };

/** FEATURES.md §8.1 — the manual, arm-by-arm timetable builder, with teacher clash detection on the server. */
export function TimetableBuilderView() {
  const { data: current } = useGetCurrentPeriodQuery();
  const sessionId = current?.session?.id ?? "";
  const { data: arms = [] } = useListClassArmsQuery();
  const [classArmId, setClassArmId] = useState("");

  const { data: grid, isLoading } = useGetArmGridQuery({ sessionId, classArmId }, { skip: !sessionId || !classArmId });
  const { data: subjects = [] } = useGetAvailableSubjectsQuery(
    { sessionId, classArmId },
    { skip: !sessionId || !classArmId },
  );
  const [setSlot, setting] = useSetSlotMutation();
  const [clearSlot, clearing] = useClearSlotMutation();
  const [setSubjectLoad, savingLoads] = useSetSubjectLoadMutation();
  const [autoGenerate, generating] = useAutoGenerateMutation();

  async function saveLoads(rows: { subjectId: string; draft: SubjectLoadDraft }[]) {
    try {
      await Promise.all(
        rows.map((row) =>
          setSubjectLoad({
            sessionId,
            classArmId,
            subjectId: row.subjectId,
            periodsPerWeek: row.draft.periodsPerWeek,
            fixedDay: row.draft.fixedDay,
          }).unwrap(),
        ),
      );
      notify.success("Subject list saved");
    } catch (error) {
      notify.error(error, "Could not save the subject list.");
    }
  }

  async function runAutoGenerate() {
    try {
      const result = await autoGenerate({ sessionId, classArmId }).unwrap();
      if (result.unplaced.length === 0) {
        notify.success(`Timetable generated — ${result.placed} lessons placed`);
      } else {
        const missing = result.unplaced.map((item) => `${item.subjectName} (${item.missing} short)`).join(", ");
        notify.warning(`Generated ${result.placed} lessons, but couldn't fit: ${missing}`, { durationMs: 10_000 });
      }
    } catch (error) {
      notify.error(error, "Could not generate this class's timetable.");
    }
  }

  const [editing, setEditing] = useState<Cell>();
  const [subjectId, setSubjectId] = useState("");

  function slotFor(day: DayOfWeek, periodId: string) {
    return grid?.slots.find((slot) => slot.dayOfWeek === day && slot.periodId === periodId);
  }

  function openEditor(day: DayOfWeek, period: Period) {
    const existing = slotFor(day, period.id);
    setEditing({ day, period });
    setSubjectId(existing?.subjectId ?? "");
  }

  async function save() {
    if (!editing || !subjectId) {
      notify.warning("Choose a subject first.");
      return;
    }
    try {
      await setSlot({ sessionId, classArmId, day: editing.day, periodId: editing.period.id, subjectId }).unwrap();
      notify.success(`${editing.period.name}, ${DAY_LABELS[editing.day]} set`);
      setEditing(undefined);
    } catch (error) {
      notify.error(error, "Could not set this lesson.");
    }
  }

  async function clear() {
    if (!editing) return;
    const existing = slotFor(editing.day, editing.period.id);
    if (!existing) {
      setEditing(undefined);
      return;
    }
    try {
      await clearSlot(existing.id).unwrap();
      notify.success(`${editing.period.name}, ${DAY_LABELS[editing.day]} cleared`);
      setEditing(undefined);
    } catch (error) {
      notify.error(error, "Could not clear this lesson.");
    }
  }

  const armOptions = arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }));

  return (
    <PageContainer>
      <PageHeader
        title="Timetable builder"
        subtitle={current?.term?.name}
        actions={
          <div className="flex gap-2">
            <AppLinkButton href="/timetable/periods" variant="secondary">
              Periods
            </AppLinkButton>
            <AppLinkButton href="/timetable/my" variant="secondary">
              My timetable
            </AppLinkButton>
          </div>
        }
      />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <div className="flex flex-wrap items-end gap-3">
            <NativeSelect
              aria-label="Class"
              placeholder="Choose a class…"
              value={classArmId}
              onChange={(event) => {
                setClassArmId(event.target.value);
                setEditing(undefined);
              }}
              options={armOptions}
              className="max-w-xs"
            />
            {grid ? (
              <AppButton type="button" variant="secondary" onClick={() => printArmTimetable(grid)}>
                Print this class&apos;s timetable
              </AppButton>
            ) : null}
          </div>
        </ContentCard>

        {!classArmId ? (
          <ContentCard>
            <EmptyState title="Choose a class" description="Pick a class to build or view its timetable." />
          </ContentCard>
        ) : (
          <SubjectLoadEditor
            key={classArmId}
            subjects={subjects}
            saving={savingLoads.isLoading}
            generating={generating.isLoading}
            onSave={saveLoads}
            onGenerate={runAutoGenerate}
          />
        )}

        {!classArmId ? null : isLoading || !grid ? (
          <p className="text-muted-foreground text-sm" role="status">
            Loading…
          </p>
        ) : grid.periods.length === 0 ? (
          <ContentCard>
            <EmptyState
              title="No periods set for this section"
              description="Add periods under Periods before building this class's timetable."
            />
          </ContentCard>
        ) : (
          <ContentCard flush>
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
              <h2 className="text-base">{grid.classLabel}&apos;s timetable</h2>
              <p className="text-muted-foreground text-xs">Click a cell to fix it by hand.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b text-left text-xs">
                  <tr>
                    <th className="px-4 py-2 font-medium">Period</th>
                    {grid.days.map((day) => (
                      <th key={day} className="px-3 py-2 font-medium">
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grid.periods.map((period) => (
                    <tr key={period.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {period.name}
                        <span className="text-muted-foreground block text-xs">
                          {period.startTime}–{period.endTime}
                        </span>
                      </td>
                      {grid.days.map((day) => {
                        if (!period.isTeaching) {
                          return (
                            <td key={day} className="bg-muted text-muted-foreground px-3 py-2.5 text-xs">
                              —
                            </td>
                          );
                        }
                        const slot = slotFor(day, period.id);
                        return (
                          <td key={day} className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => openEditor(day, period)}
                              className="hover:bg-zebra w-full rounded-md px-2 py-1 text-left"
                            >
                              {slot ? (
                                <>
                                  <span className="block font-medium">{slot.subjectName}</span>
                                  <span className="text-muted-foreground block text-xs">{slot.staffName}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-xs">Set lesson</span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentCard>
        )}

        {editing ? (
          <ContentCard>
            <h2 className="mb-2 text-base">
              {editing.period.name}, {DAY_LABELS[editing.day]}
            </h2>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No subject has a teacher assigned to this class yet. Assign one under Subject assignments first.
              </p>
            ) : (
              <NativeSelect
                aria-label="Subject"
                placeholder="Choose a subject…"
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                options={subjects.map((subject) => ({
                  value: subject.subjectId,
                  label: `${subject.subjectName} — ${subject.staffName}`,
                }))}
                className="max-w-sm"
              />
            )}
            <div className="mt-4 flex gap-2">
              <AppButton type="button" onClick={save} disabled={setting.isLoading || subjects.length === 0}>
                {setting.isLoading ? "Saving…" : "Save lesson"}
              </AppButton>
              <AppButton type="button" variant="danger" onClick={clear} disabled={clearing.isLoading}>
                Clear
              </AppButton>
              <AppButton type="button" variant="ghost" onClick={() => setEditing(undefined)}>
                Cancel
              </AppButton>
            </div>
          </ContentCard>
        ) : null}
      </div>
    </PageContainer>
  );
}
