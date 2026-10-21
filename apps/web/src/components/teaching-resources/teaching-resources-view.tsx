"use client";

import { useState } from "react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { resourceColumns } from "@/components/teaching-resources/resource-columns";
import type { ResourceRow } from "@/components/teaching-resources/resource-row";
import { useListClassLevelsQuery, useListSessionsQuery } from "@/store/api/academic-api";
import { useListSubjectsQuery } from "@/store/api/subjects-api";
import { type TeachingResourceType, useListTeachingResourcesQuery } from "@/store/api/teaching-resources-api";

const TYPE_OPTIONS = [
  { value: "SCHEME_OF_WORK", label: "Scheme of work" },
  { value: "LECTURE_NOTE", label: "Lecture note" },
  { value: "EXAM_QUESTIONS", label: "Exam questions" },
];

/** FEATURES.md — scheme of work, lecture notes and exam questions, structured templates any staff fills in. */
export function TeachingResourcesView() {
  const [type, setType] = useState<TeachingResourceType | "">("");
  const [subjectId, setSubjectId] = useState("");
  const [classLevelId, setClassLevelId] = useState("");
  const [termId, setTermId] = useState("");

  const { data: subjects = [] } = useListSubjectsQuery();
  const { data: classLevels = [] } = useListClassLevelsQuery();
  const { data: sessions = [] } = useListSessionsQuery();
  const terms = sessions.flatMap((session) => session.terms);

  const { data: resources = [], isLoading } = useListTeachingResourcesQuery({
    type: type || undefined,
    subjectId: subjectId || undefined,
    classLevelId: classLevelId || undefined,
    termId: termId || undefined,
  });

  const rows: ResourceRow[] = resources.map((resource) => ({
    ...resource,
    subjectName: subjects.find((subject) => subject.id === resource.subjectId)?.name ?? "—",
    classLevelName: classLevels.find((level) => level.id === resource.classLevelId)?.name ?? "—",
    termName: terms.find((term) => term.id === resource.termId)?.name ?? "—",
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Teaching resources"
        subtitle="Scheme of work, lecture notes and exam questions"
        actions={
          <>
            <AppLinkButton href="/teaching-resources/new/scheme-of-work" variant="secondary" size="small">
              New scheme of work
            </AppLinkButton>
            <AppLinkButton href="/teaching-resources/new/lecture-note" variant="secondary" size="small">
              New lecture note
            </AppLinkButton>
            <AppLinkButton href="/teaching-resources/new/exam-questions" size="small">
              New exam questions
            </AppLinkButton>
          </>
        }
      />

      <ContentCard className="mb-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField id="filter-type" label="Type">
            <NativeSelect
              {...controlProps("filter-type")}
              options={TYPE_OPTIONS}
              placeholder="All types"
              value={type}
              onChange={(event) => setType(event.target.value as TeachingResourceType | "")}
            />
          </FormField>
          <FormField id="filter-subject" label="Subject">
            <NativeSelect
              {...controlProps("filter-subject")}
              options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
              placeholder="All subjects"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            />
          </FormField>
          <FormField id="filter-class" label="Class">
            <NativeSelect
              {...controlProps("filter-class")}
              options={classLevels.map((level) => ({ value: level.id, label: level.name }))}
              placeholder="All classes"
              value={classLevelId}
              onChange={(event) => setClassLevelId(event.target.value)}
            />
          </FormField>
          <FormField id="filter-term" label="Term">
            <NativeSelect
              {...controlProps("filter-term")}
              options={terms.map((term) => ({ value: term.id, label: term.name }))}
              placeholder="All terms"
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
            />
          </FormField>
        </div>
      </ContentCard>

      <DataTable
        columns={resourceColumns}
        data={rows}
        isLoading={isLoading}
        emptyTitle="No teaching resources yet"
        emptyDescription="Create a scheme of work, lecture note or exam question set to see it here."
      />
    </PageContainer>
  );
}
