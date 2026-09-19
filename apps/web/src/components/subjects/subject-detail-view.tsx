"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { AppButton, AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { SubjectForm } from "@/components/subjects/subject-form";
import { SubjectOfferingsEditor } from "@/components/subjects/subject-offerings-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import {
  useDeleteSubjectMutation,
  useListSubjectsQuery,
  useUpdateSubjectMutation,
  type Subject,
  type SubjectRequest,
} from "@/store/api/subjects-api";

/** Renaming a subject, once loaded. Keyed on the subject id by the caller. */
function SubjectRename({ subject }: { subject: Subject }) {
  const [updateSubject, { isLoading }] = useUpdateSubjectMutation();
  // The unsaved name and code, seeded once from the saved subject (AGENTS.md §2).
  const [draft, setDraft] = useState<SubjectRequest>({ name: subject.name, code: subject.code });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save() {
    try {
      await updateSubject({ id: subject.id, name: draft.name.trim(), code: draft.code.trim() }).unwrap();
      notify.success("Subject saved");
    } catch (error) {
      setErrors(notify.error(error, "Could not save the subject.").fieldErrors);
    }
  }

  return (
    <SubjectForm
      idPrefix="rename"
      value={draft}
      onChange={(patch) => {
        setDraft((previous) => ({ ...previous, ...patch }));
        setErrors((current) => withoutFieldErrors(current, Object.keys(patch)));
      }}
      onSubmit={save}
      errors={errors}
      isSubmitting={isLoading}
      submitLabel="Save"
    />
  );
}

/** One subject: where it is offered, its name and code, and removal. */
export function SubjectDetailView({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const { data: subjects, isLoading } = useListSubjectsQuery();
  const [deleteSubject, { isLoading: isDeleting }] = useDeleteSubjectMutation();
  const subject = subjects?.find((candidate) => candidate.id === subjectId);

  async function remove(target: Subject) {
    try {
      await deleteSubject(target.id).unwrap();
      notify.success(`${target.name} removed`);
      router.push("/subjects");
    } catch (error) {
      notify.error(error, `Could not remove ${target.name}.`);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={subject ? subject.name : "Subject"}
        subtitle={subject ? `Code ${subject.code}` : undefined}
        actions={
          <AppLinkButton href="/subjects" variant="secondary">
            All subjects
          </AppLinkButton>
        }
      />
      {isLoading ? (
        <p className="text-muted-foreground text-sm" role="status">
          Loading…
        </p>
      ) : !subject ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>This subject could not be found.</AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-5">
          <SubjectOfferingsEditor subject={subject} />

          <ContentCard>
            <h2 className="mb-4 text-base">Name and code</h2>
            <SubjectRename key={subject.id} subject={subject} />
          </ContentCard>

          <ContentCard className="flex flex-wrap items-center gap-3">
            <p className="text-body flex-1 text-sm">
              Remove this subject from the catalogue. Not possible while teachers are assigned to it.
            </p>
            <AppButton variant="danger" size="small" onClick={() => remove(subject)} disabled={isDeleting}>
              <Trash2 aria-hidden="true" />
              {isDeleting ? "Removing…" : "Remove subject"}
            </AppButton>
          </ContentCard>
        </div>
      )}
    </PageContainer>
  );
}
