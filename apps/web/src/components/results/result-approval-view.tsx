"use client";

import { useState } from "react";
import { AppButton, AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TextInput } from "@/components/common/text-input";
import { approvalColumns } from "@/components/results/approval-columns";
import { SubjectScoresCard } from "@/components/results/subject-scores-card";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import {
  useApproveSheetMutation,
  useGetApprovalStatusQuery,
  useGetSubjectScoresQuery,
  usePublishArmMutation,
  useReviewSheetMutation,
  useSubmitSheetMutation,
  useUnlockSheetMutation,
  type ApprovalSubject,
} from "@/store/api/approval-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

/**
 * FEATURES.md §5.4 — where each subject sheet for one class sits in the
 * approval chain, and the next step the signed-in person can take.
 */
export function ResultApprovalView() {
  const accessToken = useAppSelector(selectAccessToken);
  const roles = (accessToken ? decodeAccessToken(accessToken)?.roles : undefined) ?? [];
  const canPublish = roles.includes("PRINCIPAL") || roles.includes("SUPERADMIN");

  const { data: period } = useGetCurrentPeriodQuery();
  const termId = period?.term?.id ?? "";
  const { data: arms = [] } = useListClassArmsQuery();
  const [classArmId, setClassArmId] = useState("");
  const { data: status, isLoading } = useGetApprovalStatusQuery(
    { termId, classArmId },
    { skip: !termId || !classArmId },
  );

  const [submit, submitting] = useSubmitSheetMutation();
  const [review, reviewing] = useReviewSheetMutation();
  const [approve, approving] = useApproveSheetMutation();
  const [unlock, unlocking] = useUnlockSheetMutation();
  const [publish, publishing] = usePublishArmMutation();

  const [viewing, setViewing] = useState<ApprovalSubject>();
  const { data: viewedScores, isFetching: loadingScores } = useGetSubjectScoresQuery(
    { termId, classArmId, subjectId: viewing?.subjectId ?? "" },
    { skip: !viewing || !classArmId },
  );
  const [reopening, setReopening] = useState<ApprovalSubject>();
  const [reopenReason, setReopenReason] = useState("");

  async function step(run: () => Promise<unknown>, success: string, failure: string): Promise<void> {
    try {
      await run();
      notify.success(success);
    } catch (error) {
      notify.error(error, failure);
    }
  }

  function target(subject: ApprovalSubject) {
    return { termId, classArmId, subjectId: subject.subjectId };
  }

  const columns = approvalColumns({
    roles,
    onSubmit: (subject) =>
      step(() => submit(target(subject)).unwrap(), `${subject.subjectName} submitted for review`, "Could not submit."),
    onReview: (subject) =>
      step(() => review(target(subject)).unwrap(), `${subject.subjectName} marked as reviewed`, "Could not review."),
    onApprove: (subject) =>
      step(() => approve(target(subject)).unwrap(), `${subject.subjectName} approved and frozen`, "Could not approve."),
    onReopen: (subject) => {
      setReopening(subject);
      setReopenReason("");
    },
    onView: (subject) => setViewing(subject),
  });

  async function confirmReopen() {
    if (!reopening) return;
    const reason = reopenReason.trim();
    if (!reason) {
      notify.warning("Give a reason for reopening these scores.");
      return;
    }
    await step(
      () => unlock({ ...target(reopening), reason }).unwrap(),
      `${reopening.subjectName} reopened — the teacher can edit again`,
      "Could not reopen these scores.",
    );
    setReopening(undefined);
  }

  async function publishClass() {
    try {
      const result = await publish({ termId, classArmId }).unwrap();
      notify.success(`${result.published} subject${result.published === 1 ? "" : "s"} published`);
    } catch (error) {
      notify.error(error, "Could not publish this class.");
    }
  }

  const busy = submitting.isLoading || reviewing.isLoading || approving.isLoading || unlocking.isLoading;
  const armOptions = arms.map((arm) => ({ value: arm.id, label: `${arm.classLevel.name}${arm.name}` }));

  return (
    <PageContainer>
      <PageHeader
        title="Results approval"
        subtitle={period?.term?.name}
        actions={
          <AppLinkButton href="/results/remarks" variant="secondary">
            Remarks and traits
          </AppLinkButton>
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
                setReopening(undefined);
                setViewing(undefined);
              }}
              options={armOptions}
              className="max-w-xs"
            />
            {canPublish && classArmId ? (
              <AppButton type="button" variant="secondary" onClick={publishClass} disabled={publishing.isLoading}>
                {publishing.isLoading ? "Publishing…" : "Publish this class"}
              </AppButton>
            ) : null}
          </div>
          {canPublish && classArmId ? (
            <p className="text-muted-foreground mt-2 text-xs">
              Publishes every approved subject for this class. Parents see results only after this step.
            </p>
          ) : null}
        </ContentCard>

        {!classArmId ? (
          <ContentCard>
            <EmptyState title="Choose a class" description="Pick a class to see where each subject stands." />
          </ContentCard>
        ) : (
          <ContentCard flush>
            <DataTable
              columns={columns}
              data={status?.subjects ?? []}
              isLoading={isLoading}
              emptyTitle="No subjects are taught in this class yet"
              emptyDescription="Assign subject teachers in Class allocation first."
            />
          </ContentCard>
        )}

        {viewing ? (
          <SubjectScoresCard
            subjectName={viewing.subjectName}
            scores={viewedScores}
            isLoading={loadingScores}
            onClose={() => setViewing(undefined)}
          />
        ) : null}

        {reopening ? (
          <ContentCard>
            <h2 className="mb-2 text-base">Reopen {reopening.subjectName}</h2>
            <p className="text-muted-foreground mb-3 text-xs">
              The subject teacher can edit these scores again and must submit them once more. The reason is kept in the
              audit log.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <TextInput
                aria-label="Reason for reopening"
                placeholder="Reason for reopening"
                value={reopenReason}
                onChange={(event) => setReopenReason(event.target.value)}
                className="w-80"
              />
              <AppButton type="button" variant="danger" onClick={confirmReopen} disabled={busy}>
                {unlocking.isLoading ? "Reopening…" : "Reopen scores"}
              </AppButton>
              <AppButton type="button" variant="ghost" onClick={() => setReopening(undefined)}>
                Cancel
              </AppButton>
            </div>
          </ContentCard>
        ) : null}
      </div>
    </PageContainer>
  );
}
