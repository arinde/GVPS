"use client";

import { useState } from "react";
import { AttendanceRegisterTable } from "@/components/attendance/attendance-register-table";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TextInput } from "@/components/common/text-input";
import { LoadingState } from "@/components/common/spinner";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { useListClassArmsQuery } from "@/store/api/academic-api";
import {
  useGetPeriodAttendanceQuery,
  useMarkPeriodAttendanceMutation,
  type AttendanceMark,
} from "@/store/api/attendance-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";
import { useListSubjectsQuery, useListTeachingAssignmentsQuery } from "@/store/api/subjects-api";
import { useListPeriodsQuery } from "@/store/api/timetable-api";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * FEATURES.md §4.2 — one mark a period, by the subject teacher, for Senior
 * (optional per school policy, so nothing here forces it). Mirrors score
 * entry's picker: a teacher opens one of their own subject × class
 * assignments; superadmin opens any, for corrections.
 */
export function PeriodAttendanceView() {
  const accessToken = useAppSelector(selectAccessToken);
  const claims = decodeAccessToken(accessToken ?? "");
  const staffId = claims?.sub;
  const isSuperadmin = claims?.roles.includes("SUPERADMIN") ?? false;

  const { data: assignments = [] } = useListTeachingAssignmentsQuery(staffId ?? "", {
    skip: !staffId || isSuperadmin,
  });
  const { data: subjects = [] } = useListSubjectsQuery(undefined, { skip: !isSuperadmin });
  const { data: arms = [] } = useListClassArmsQuery();

  const [assignmentId, setAssignmentId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classArmId, setClassArmId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [date, setDate] = useState(today);
  const [markPeriod, marking] = useMarkPeriodAttendanceMutation();

  const assignment = assignments.find((candidate) => candidate.id === assignmentId);
  const resolvedSubjectId = isSuperadmin ? subjectId : assignment?.subject.id;
  const resolvedClassArmId = isSuperadmin ? classArmId : assignment?.classArm.id;
  const section = arms.find((arm) => arm.id === resolvedClassArmId)?.classLevel.section;

  const { data: periods = [] } = useListPeriodsQuery(section ?? "SENIOR", { skip: !section });
  const teachingPeriods = periods.filter((period) => period.isTeaching);

  const ready = Boolean(resolvedSubjectId && resolvedClassArmId && periodId && date);
  const { data: register, isLoading } = useGetPeriodAttendanceQuery(
    { classArmId: resolvedClassArmId ?? "", subjectId: resolvedSubjectId ?? "", periodId, date },
    { skip: !ready },
  );

  async function save(marks: AttendanceMark[]) {
    try {
      await markPeriod({
        classArmId: resolvedClassArmId ?? "",
        subjectId: resolvedSubjectId ?? "",
        periodId,
        date,
        marks,
      }).unwrap();
      notify.success("Attendance saved");
    } catch (error) {
      notify.error(error, "Could not save attendance.");
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Period attendance" subtitle="Senior — one mark a period, where the school marks it this way" />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            {isSuperadmin ? (
              <>
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium" htmlFor="period-attendance-class">
                    Class
                  </label>
                  <NativeSelect
                    id="period-attendance-class"
                    placeholder="Choose a class…"
                    value={classArmId}
                    onChange={(event) => setClassArmId(event.target.value)}
                    options={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium" htmlFor="period-attendance-subject">
                    Subject
                  </label>
                  <NativeSelect
                    id="period-attendance-subject"
                    placeholder="Choose a subject…"
                    value={subjectId}
                    onChange={(event) => setSubjectId(event.target.value)}
                    options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium" htmlFor="period-attendance-assignment">
                  Class and subject
                </label>
                <NativeSelect
                  id="period-attendance-assignment"
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

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium" htmlFor="period-attendance-period">
                Period
              </label>
              <NativeSelect
                id="period-attendance-period"
                placeholder="Choose a period…"
                value={periodId}
                onChange={(event) => setPeriodId(event.target.value)}
                options={teachingPeriods.map((period) => ({
                  value: period.id,
                  label: `${period.name} (${period.startTime}–${period.endTime})`,
                }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="period-attendance-date">
                Date
              </label>
              <TextInput
                id="period-attendance-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
        </ContentCard>

        {!ready ? (
          <ContentCard>
            <EmptyState title="Choose a class, subject and period" description="Pick all three to mark attendance." />
          </ContentCard>
        ) : isLoading || !register ? (
          <LoadingState />
        ) : (
          <AttendanceRegisterTable
            key={`${resolvedClassArmId}-${resolvedSubjectId}-${periodId}-${date}`}
            register={register}
            saving={marking.isLoading}
            onSave={save}
          />
        )}
      </div>
    </PageContainer>
  );
}
