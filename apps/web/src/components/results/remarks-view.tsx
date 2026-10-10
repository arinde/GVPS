"use client";

import { useState } from "react";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StudentRemarkForm } from "@/components/results/student-remark-form";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import { useListRemarksQuery, useSaveRemarkMutation, type SaveRemarkRequest } from "@/store/api/remarks-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

/**
 * FEATURES.md §5.6–5.7 — the form teacher writes traits and the form comment
 * for each student; the principal writes the principal's comment. Each person
 * sees only the fields they can write.
 */
export function RemarksView() {
  const accessToken = useAppSelector(selectAccessToken);
  const roles = (accessToken ? decodeAccessToken(accessToken)?.roles : undefined) ?? [];
  const canWritePrincipal = roles.includes("PRINCIPAL") || roles.includes("SUPERADMIN");
  const canWriteForm = roles.includes("FORM_TEACHER") || roles.includes("SUPERADMIN");

  const { data: period } = useGetCurrentPeriodQuery();
  const termId = period?.term?.id ?? "";
  const { data: arms = [] } = useListClassArmsQuery();
  const [classArmId, setClassArmId] = useState("");
  const [studentId, setStudentId] = useState("");
  const { data, isLoading } = useListRemarksQuery({ termId, classArmId }, { skip: !termId || !classArmId });
  const [save, saving] = useSaveRemarkMutation();

  const selected = data?.students.find((student) => student.studentId === studentId);
  const armOptions = arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }));

  async function saveFor(payload: Omit<SaveRemarkRequest, "termId" | "studentId">) {
    if (!selected) return;
    try {
      await save({ termId, studentId: selected.studentId, ...payload }).unwrap();
      notify.success(`Remarks saved for ${selected.name}`);
    } catch (error) {
      notify.error(error, "Could not save these remarks.");
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Remarks and traits" subtitle={period?.term?.name} />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <div className="flex flex-wrap items-end gap-3">
            <NativeSelect
              aria-label="Class"
              placeholder="Choose a class…"
              value={classArmId}
              onChange={(event) => {
                setClassArmId(event.target.value);
                setStudentId("");
              }}
              options={armOptions}
              className="max-w-xs"
            />
            <NativeSelect
              aria-label="Student"
              placeholder={classArmId ? "Choose a student…" : "Choose a class first"}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              options={(data?.students ?? []).map((student) => ({
                value: student.studentId,
                label: `${student.name}${student.locked ? " (published)" : ""}`,
              }))}
              disabled={!classArmId || isLoading}
              className="max-w-sm"
            />
          </div>
        </ContentCard>

        {selected && data ? (
          <StudentRemarkForm
            key={selected.studentId}
            student={selected}
            traitGroups={data.traitGroups}
            canWriteForm={canWriteForm}
            canWritePrincipal={canWritePrincipal}
            saving={saving.isLoading}
            onSave={saveFor}
          />
        ) : (
          <ContentCard>
            <EmptyState
              title="Choose a student"
              description="Pick a class, then a student, to write their remarks and traits."
            />
          </ContentCard>
        )}
      </div>
    </PageContainer>
  );
}
