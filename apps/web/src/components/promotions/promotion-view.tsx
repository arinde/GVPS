"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { PromotionPicker } from "@/components/promotions/promotion-picker";
import { PromotionResultCard } from "@/components/promotions/promotion-result-card";
import { DEPARTMENT_OPTIONS } from "@/components/subjects/subject-labels";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import { useListClassArmsQuery, useListSessionsQuery } from "@/store/api/academic-api";
import {
  useGetPromotionCandidatesQuery,
  usePromoteClassMutation,
  type PromotionResult,
} from "@/store/api/promotions-api";
import type { Department } from "@/store/api/subjects-api";

type Draft = { fromClassArmId: string; toSessionId: string; toClassArmId: string; stream: Department | "" };
const EMPTY: Draft = { fromClassArmId: "", toSessionId: "", toClassArmId: "", stream: "" };

/**
 * End of year (FEATURES.md §3.6): move a class into the next session. A new
 * enrolment is created and the old one is left as it was, so each year stays
 * readable. Choosing the same class again repeats the year, and moving into
 * JSS 1 issues each pupil a secondary admission number.
 */
export function PromotionView() {
  const { data: arms = [] } = useListClassArmsQuery();
  const { data: sessions = [] } = useListSessionsQuery();
  const [promote, { isLoading }] = usePromoteClassMutation();
  // Unsaved choices, and the last result to show afterwards (AGENTS.md §2).
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PromotionResult>();
  const { data: candidates } = useGetPromotionCandidatesQuery(draft.fromClassArmId, { skip: !draft.fromClassArmId });

  const students = candidates?.students ?? [];
  const destination = arms.find((arm) => arm.id === draft.toClassArmId);
  const needsDepartment = destination?.classLevel.section === "SENIOR" && !destination.stream;

  function change(patch: Partial<Draft>) {
    // A different source class means a different list of students.
    if (patch.fromClassArmId !== undefined) setStudentIds([]);
    setDraft((previous) => ({ ...previous, ...patch }));
    setErrors((current) => withoutFieldErrors(current, Object.keys(patch)));
  }

  function toggleStudent(studentId: string, checked: boolean) {
    setStudentIds((current) => (checked ? [...current, studentId] : current.filter((id) => id !== studentId)));
  }

  async function run() {
    setResult(undefined);
    try {
      const promotion = await promote({
        fromClassArmId: draft.fromClassArmId,
        toSessionId: draft.toSessionId,
        toClassArmId: draft.toClassArmId,
        studentIds,
        ...(draft.stream ? { stream: draft.stream } : {}),
      }).unwrap();
      setResult(promotion);
      notify.success(`${promotion.promoted} students promoted`, {
        description: promotion.reissued ? `${promotion.reissued} received a secondary admission number.` : undefined,
        durationMs: promotion.reissued ? 12_000 : undefined,
      });
      setStudentIds([]);
    } catch (error) {
      setErrors(notify.error(error, "Could not promote this class.").fieldErrors);
    }
  }

  const classOptions = arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }));
  const ready = draft.fromClassArmId && draft.toSessionId && draft.toClassArmId && studentIds.length > 0;
  const promoteHint = !draft.fromClassArmId
    ? "Choose the class to promote from."
    : !draft.toSessionId || !draft.toClassArmId
      ? "Choose the session and class to promote into."
      : studentIds.length === 0
        ? "Select at least one student."
        : null;

  return (
    <PageContainer>
      <PageHeader
        title="Promotion"
        subtitle="Move a class into the next session. Nobody moves until you press promote."
      />

      <div className="flex flex-col gap-5">
        <ContentCard className="flex flex-col gap-5">
          <PromotionPicker
            classes={classOptions}
            sessions={sessions.map((session) => ({
              value: session.id,
              label: `${session.name}${session.isCurrent ? " (current)" : ""}`,
            }))}
            departments={DEPARTMENT_OPTIONS}
            fromClassArmId={draft.fromClassArmId}
            toSessionId={draft.toSessionId}
            toClassArmId={draft.toClassArmId}
            stream={draft.stream}
            students={students}
            studentIds={studentIds}
            needsDepartment={Boolean(needsDepartment)}
            onChange={change}
            onToggleStudent={toggleStudent}
            errors={errors}
            disabled={isLoading}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-start gap-1">
              <AppButton onClick={run} disabled={!ready || isLoading}>
                {isLoading
                  ? "Promoting…"
                  : `Promote ${studentIds.length || ""} student${studentIds.length === 1 ? "" : "s"}`}
                <ArrowRight aria-hidden="true" />
              </AppButton>
              {!ready && promoteHint ? <p className="text-muted-foreground text-xs">{promoteHint}</p> : null}
            </div>
            {students.length ? (
              <AppButton
                variant="secondary"
                disabled={isLoading}
                onClick={() => setStudentIds(studentIds.length === students.length ? [] : students.map((s) => s.id))}
              >
                {studentIds.length === students.length ? "Clear all" : "Select everyone"}
              </AppButton>
            ) : null}
          </div>
        </ContentCard>

        {result ? <PromotionResultCard result={result} /> : null}
      </div>
    </PageContainer>
  );
}
