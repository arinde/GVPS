"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { LoadingState } from "@/components/common/spinner";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StatusPill } from "@/components/common/status-pill";
import { TextInput } from "@/components/common/text-input";
import { ExamQuestionsForm } from "@/components/teaching-resources/exam-questions-form";
import { LectureNoteForm } from "@/components/teaching-resources/lecture-note-form";
import { ResourceContent } from "@/components/teaching-resources/resource-content";
import { SchemeOfWorkForm } from "@/components/teaching-resources/scheme-of-work-form";
import { TYPE_LABELS } from "@/components/teaching-resources/resource-row";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { printTeachingResource } from "@/lib/print-teaching-resource";
import { useListClassLevelsQuery, useListSessionsQuery } from "@/store/api/academic-api";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useListSubjectsQuery } from "@/store/api/subjects-api";
import {
  useApproveTeachingResourceMutation,
  useDeleteTeachingResourceMutation,
  useGetTeachingResourceQuery,
  useRejectTeachingResourceMutation,
  useSubmitTeachingResourceMutation,
} from "@/store/api/teaching-resources-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

const APPROVER_ROLES = ["SUPERADMIN", "PRINCIPAL"];

const STATUS_PILL = {
  DRAFT: { tone: "warning", shape: "diamond", label: "Draft" },
  SUBMITTED: { tone: "info", shape: "hollow", label: "Submitted" },
  APPROVED: { tone: "success", shape: "circle", label: "Approved" },
} as const;

export type TeachingResourceDetailViewProps = { id: string };

/** FEATURES.md — one resource: editable while a draft, read-only and actionable once submitted or approved. */
export function TeachingResourceDetailView({ id }: TeachingResourceDetailViewProps) {
  const router = useRouter();
  const accessToken = useAppSelector(selectAccessToken);
  const roles = decodeAccessToken(accessToken ?? "")?.roles ?? [];
  const isApprover = roles.some((role) => APPROVER_ROLES.includes(role));

  const { data: resource, isLoading } = useGetTeachingResourceQuery(id);
  const { data: access } = useGetMyAccessQuery();
  const { data: subjects = [] } = useListSubjectsQuery();
  const { data: classLevels = [] } = useListClassLevelsQuery();
  const { data: sessions = [] } = useListSessionsQuery();
  const terms = sessions.flatMap((session) => session.terms);

  const [submit, { isLoading: submitting }] = useSubmitTeachingResourceMutation();
  const [approve, { isLoading: approving }] = useApproveTeachingResourceMutation();
  const [reject, { isLoading: rejecting }] = useRejectTeachingResourceMutation();
  const [remove, { isLoading: deleting }] = useDeleteTeachingResourceMutation();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (isLoading || !resource) return <LoadingState />;

  const subjectName = subjects.find((subject) => subject.id === resource.subjectId)?.name ?? "—";
  const classLevelName = classLevels.find((level) => level.id === resource.classLevelId)?.name ?? "—";
  const termName = terms.find((term) => term.id === resource.termId)?.name ?? "—";
  const pill = STATUS_PILL[resource.status];

  async function handleSubmit() {
    try {
      await submit(id).unwrap();
      notify.success("Submitted for approval");
    } catch (error) {
      notify.error(error, "Could not submit this.");
    }
  }

  async function handleApprove() {
    try {
      await approve(id).unwrap();
      notify.success("Approved");
    } catch (error) {
      notify.error(error, "Could not approve this.");
    }
  }

  async function handleReject() {
    if (reason.trim().length < 3) {
      notify.warning("Give a short reason.");
      return;
    }
    try {
      await reject({ id, reason: reason.trim() }).unwrap();
      notify.success("Sent back to draft");
      setRejectOpen(false);
      setReason("");
    } catch (error) {
      notify.error(error, "Could not send this back.");
    }
  }

  async function handleDelete() {
    try {
      await remove(id).unwrap();
      notify.success("Draft deleted");
      router.push("/teaching-resources");
    } catch (error) {
      notify.error(error, "Could not delete this draft.");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={resource.title}
        subtitle={`${TYPE_LABELS[resource.type]} · ${subjectName} · ${classLevelName} · ${termName}`}
        actions={
          <>
            <StatusPill tone={pill.tone} shape={pill.shape}>
              {pill.label}
            </StatusPill>
            {resource.status !== "DRAFT" ? (
              <AppButton
                type="button"
                variant="secondary"
                size="small"
                onClick={() =>
                  printTeachingResource({
                    schoolName: access?.school.name ?? "",
                    subjectName,
                    classLevelName,
                    termName,
                    resource,
                  })
                }
              >
                Print
              </AppButton>
            ) : null}
          </>
        }
      />

      {resource.status === "DRAFT" ? (
        <>
          {resource.type === "SCHEME_OF_WORK" ? (
            <SchemeOfWorkForm resource={{ ...resource, content: resource.content as never }} />
          ) : resource.type === "LECTURE_NOTE" ? (
            <LectureNoteForm resource={{ ...resource, content: resource.content as never }} />
          ) : (
            <ExamQuestionsForm resource={{ ...resource, content: resource.content as never }} />
          )}
          <ContentCard className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">Ready? Submitting locks editing until an admin reviews it.</p>
            <div className="flex gap-2">
              <AppButton type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
                Delete draft
              </AppButton>
              <AppButton type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit for approval"}
              </AppButton>
            </div>
          </ContentCard>
        </>
      ) : (
        <div className="flex flex-col gap-5">
          <ResourceContent resource={resource} />
          {resource.status === "SUBMITTED" && isApprover ? (
            <ContentCard className="flex flex-col gap-3">
              <p className="text-sm">Awaiting your review.</p>
              <div className="flex flex-wrap items-center gap-2">
                <AppButton type="button" onClick={handleApprove} disabled={approving}>
                  {approving ? "Approving…" : "Approve"}
                </AppButton>
                <AppButton type="button" variant="secondary" onClick={() => setRejectOpen(true)}>
                  Send back
                </AppButton>
              </div>
              {rejectOpen ? (
                <div className="flex flex-wrap items-center gap-2">
                  <TextInput
                    aria-label="Reason for sending this back"
                    placeholder="Reason, e.g. week 3 is missing"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="w-80"
                  />
                  <AppButton type="button" variant="danger" onClick={handleReject} disabled={rejecting}>
                    {rejecting ? "Sending back…" : "Confirm"}
                  </AppButton>
                  <AppButton type="button" variant="ghost" onClick={() => setRejectOpen(false)}>
                    Cancel
                  </AppButton>
                </div>
              ) : null}
            </ContentCard>
          ) : null}
          {resource.status === "SUBMITTED" && !isApprover ? (
            <p className="text-muted-foreground text-sm">
              Submitted, awaiting the principal or superadmin&apos;s review.
            </p>
          ) : null}
        </div>
      )}
    </PageContainer>
  );
}
