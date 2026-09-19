"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { subjectColumns } from "@/components/subjects/subject-columns";
import { SubjectForm } from "@/components/subjects/subject-form";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import { useCreateSubjectMutation, useListSubjectsQuery, type SubjectRequest } from "@/store/api/subjects-api";

const EMPTY: SubjectRequest = { name: "", code: "" };

/**
 * The subject catalogue (FEATURES.md §2.3). Adding a subject opens it, so the
 * next step — choosing the classes that take it — follows straight on.
 */
export function SubjectsView() {
  const router = useRouter();
  const { data: subjects = [], isLoading } = useListSubjectsQuery();
  const [createSubject, { isLoading: isCreating }] = useCreateSubjectMutation();
  // The unsaved new subject (AGENTS.md §2: local form state).
  const [draft, setDraft] = useState<SubjectRequest>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function patch(changes: Partial<SubjectRequest>) {
    setDraft((previous) => ({ ...previous, ...changes }));
    setErrors((current) => withoutFieldErrors(current, Object.keys(changes)));
  }

  async function create() {
    try {
      const subject = await createSubject({ name: draft.name.trim(), code: draft.code.trim() }).unwrap();
      notify.success(`${subject.name} added`, { description: "Now choose the classes that take it." });
      setDraft(EMPTY);
      router.push(`/subjects/${subject.id}`);
    } catch (error) {
      setErrors(notify.error(error, "Could not add the subject.").fieldErrors);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Subjects"
        subtitle={`${subjects.length} subject${subjects.length === 1 ? "" : "s"} · choose where each is taught, then assign teachers from their staff profile`}
      />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <h2 className="mb-4 text-base">Add a subject</h2>
          <SubjectForm
            value={draft}
            onChange={patch}
            onSubmit={create}
            errors={errors}
            isSubmitting={isCreating}
            submitLabel="Add subject"
          />
        </ContentCard>

        <ContentCard flush>
          <DataTable
            columns={subjectColumns}
            data={subjects}
            isLoading={isLoading}
            emptyTitle="No subjects yet"
            emptyDescription="Add the first subject above — for example Mathematics, code MTH."
          />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
