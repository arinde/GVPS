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
import { useGetMyAccessQuery } from "@/store/api/access-api";
import {
  useGetDailyAttendanceQuery,
  useMarkDailyAttendanceMutation,
  type AttendanceMark,
} from "@/store/api/attendance-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * FEATURES.md §4.1 — one mark a day, by the form teacher, for Primary and
 * Junior. A form teacher sees only their own allocated arm(s); superadmin
 * gets every arm, for corrections (same pattern as score entry's picker).
 */
export function DailyAttendanceView() {
  const accessToken = useAppSelector(selectAccessToken);
  const isSuperadmin = decodeAccessToken(accessToken ?? "")?.roles.includes("SUPERADMIN") ?? false;

  const { data: access } = useGetMyAccessQuery(undefined, { skip: isSuperadmin });
  const { data: allArms = [] } = useListClassArmsQuery(undefined, { skip: !isSuperadmin });
  const arms = isSuperadmin ? allArms : (access?.allocatedArms ?? []);

  const [classArmId, setClassArmId] = useState("");
  const [date, setDate] = useState(today);
  const [markDaily, marking] = useMarkDailyAttendanceMutation();

  const ready = Boolean(classArmId && date);
  const { data: register, isLoading } = useGetDailyAttendanceQuery({ classArmId, date }, { skip: !ready });

  async function save(marks: AttendanceMark[]) {
    try {
      await markDaily({ classArmId, date, marks }).unwrap();
      notify.success("Attendance saved");
    } catch (error) {
      notify.error(error, "Could not save attendance.");
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Daily attendance" subtitle="Primary and Junior — one mark a day" />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium" htmlFor="daily-attendance-class">
                Class
              </label>
              <NativeSelect
                id="daily-attendance-class"
                placeholder="Choose a class…"
                value={classArmId}
                onChange={(event) => setClassArmId(event.target.value)}
                options={arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="daily-attendance-date">
                Date
              </label>
              <TextInput
                id="daily-attendance-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
        </ContentCard>

        {!ready ? (
          <ContentCard>
            <EmptyState title="Choose a class and date" description="Pick a class to mark its attendance." />
          </ContentCard>
        ) : isLoading || !register ? (
          <LoadingState />
        ) : (
          <AttendanceRegisterTable
            key={`${classArmId}-${date}`}
            register={register}
            saving={marking.isLoading}
            onSave={save}
          />
        )}
      </div>
    </PageContainer>
  );
}
