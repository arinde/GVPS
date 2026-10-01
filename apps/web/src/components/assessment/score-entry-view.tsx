"use client";

import { useState } from "react";
import { ScoreEntryTable } from "@/components/assessment/score-entry-table";
import { ContentCard } from "@/components/common/content-card";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import { useGetScoreGridQuery } from "@/store/api/score-entry-api";
import { useListSubjectsQuery, useListTeachingAssignmentsQuery } from "@/store/api/subjects-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

/**
 * §5.3 score entry: a teacher picks one of their own subject × class
 * assignments, ScoreEntryService enforces it is actually theirs. Superadmin
 * has no assignments of their own (FEATURES.md §1.1's "subject teacher"
 * scope doesn't apply to them) but the API lets them open any class and
 * subject for corrections, so they get a separate, unfiltered picker rather
 * than an always-empty dropdown.
 */
export function ScoreEntryView() {
  const accessToken = useAppSelector(selectAccessToken);
  const claims = accessToken ? decodeAccessToken(accessToken) : null;
  const staffId = claims?.sub;
  const isSuperadmin = claims?.roles.includes("SUPERADMIN") ?? false;

  const { data: period } = useGetCurrentPeriodQuery();
  const { data: assignments = [] } = useListTeachingAssignmentsQuery(staffId ?? "", {
    skip: !staffId || isSuperadmin,
  });
  const { data: subjects = [] } = useListSubjectsQuery(undefined, { skip: !isSuperadmin });
  // Fetched regardless of role: the teacher picker doesn't carry a section on
  // its assignments, and the grade preview needs one to pick the right scale.
  const { data: arms = [] } = useListClassArmsQuery();

  const [assignmentId, setAssignmentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classArmId, setClassArmId] = useState("");

  const assignment = assignments.find((candidate) => candidate.id === assignmentId);
  const resolvedSubjectId = isSuperadmin ? subjectId : assignment?.subject.id;
  const resolvedClassArmId = isSuperadmin ? classArmId : assignment?.classArm.id;
  const termId = period?.term?.id;
  const section = arms.find((arm) => arm.id === resolvedClassArmId)?.classLevel.section;
  const ready = Boolean(resolvedSubjectId && resolvedClassArmId && termId);

  const { data: grid, isLoading } = useGetScoreGridQuery(
    { termId: termId ?? "", subjectId: resolvedSubjectId ?? "", classArmId: resolvedClassArmId ?? "" },
    { skip: !ready },
  );

  return (
    <PageContainer>
      <PageHeader title="Score entry" subtitle={period?.term?.name} />

      <div className="flex flex-col gap-5">
        <ContentCard>
          {isSuperadmin ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium" htmlFor="score-entry-class">
                  Class
                </label>
                <NativeSelect
                  id="score-entry-class"
                  placeholder="Choose a class…"
                  value={classArmId}
                  onChange={(event) => setClassArmId(event.target.value)}
                  options={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
                />
              </div>
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium" htmlFor="score-entry-subject">
                  Subject
                </label>
                <NativeSelect
                  id="score-entry-subject"
                  placeholder="Choose a subject…"
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="score-entry-assignment">
                Class and subject
              </label>
              <NativeSelect
                id="score-entry-assignment"
                placeholder="Choose a class and subject…"
                value={assignmentId}
                onChange={(event) => setAssignmentId(event.target.value)}
                options={assignments.map((candidate) => ({
                  value: candidate.id,
                  label: `${candidate.classArm.classLevel.name}${candidate.classArm.name} — ${candidate.subject.name}`,
                }))}
              />
            </div>
          )}
        </ContentCard>

        {isLoading ? <p className="text-muted-foreground text-sm">Loading…</p> : null}

        {/* Keyed so switching class/subject remounts with a fresh draft instead of needing an effect to reset it. */}
        {grid && section ? (
          <ScoreEntryTable
            key={`${termId}-${resolvedSubjectId}-${resolvedClassArmId}`}
            grid={grid}
            section={section}
            termId={termId ?? ""}
            subjectId={resolvedSubjectId ?? ""}
            classArmId={resolvedClassArmId ?? ""}
          />
        ) : null}

        <p className="text-muted-foreground text-xs">
          Type a score, then press <strong>Save</strong> on that row. Scores do not save on their own.
        </p>
      </div>
    </PageContainer>
  );
}
