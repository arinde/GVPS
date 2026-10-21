"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { FormField, controlProps } from "@/components/common/form-field";
import { Textarea } from "@/components/common/textarea";
import { PasteToFill } from "@/components/teaching-resources/paste-to-fill";
import { ResourceMetaFields, type ResourceMeta } from "@/components/teaching-resources/resource-meta-fields";
import { notify } from "@/lib/notify";
import { parseLectureNote } from "@/lib/parse-teaching-resource";
import { useListClassLevelsQuery, useListSessionsQuery } from "@/store/api/academic-api";
import { useListSubjectsQuery } from "@/store/api/subjects-api";
import {
  useCreateTeachingResourceMutation,
  useUpdateTeachingResourceMutation,
  type LectureNoteContent,
  type TeachingResource,
} from "@/store/api/teaching-resources-api";

const EMPTY_CONTENT: LectureNoteContent = { objectives: "", body: "", references: "" };

export type LectureNoteFormProps = { resource?: TeachingResource & { content: LectureNoteContent } };

/** FEATURES.md — a lecture note: objectives, the lesson content, and further references. */
export function LectureNoteForm({ resource }: LectureNoteFormProps) {
  const router = useRouter();
  const { data: subjects = [] } = useListSubjectsQuery();
  const { data: classLevels = [] } = useListClassLevelsQuery();
  const { data: sessions = [] } = useListSessionsQuery();
  const terms = sessions.flatMap((session) => session.terms);

  const [meta, setMeta] = useState<ResourceMeta>({
    title: resource?.title ?? "",
    subjectId: resource?.subjectId ?? "",
    classLevelId: resource?.classLevelId ?? "",
    termId: resource?.termId ?? "",
  });
  const [content, setContent] = useState<LectureNoteContent>(resource?.content ?? EMPTY_CONTENT);
  const [create, { isLoading: creating }] = useCreateTeachingResourceMutation();
  const [update, { isLoading: updating }] = useUpdateTeachingResourceMutation();
  const saving = creating || updating;

  async function handleSave() {
    if (!meta.title.trim() || !meta.subjectId || !meta.classLevelId || !meta.termId) {
      notify.warning("Fill in the title, subject, class and term first.");
      return;
    }
    if (!content.body.trim()) {
      notify.warning("The lecture needs some content.");
      return;
    }

    const body = { type: "LECTURE_NOTE" as const, ...meta, content };
    try {
      const saved = resource ? await update({ id: resource.id, body }).unwrap() : await create(body).unwrap();
      notify.success(resource ? "Lecture note updated" : "Lecture note saved as a draft");
      router.push(`/teaching-resources/${saved.id}`);
    } catch (error) {
      notify.error(error, "Could not save this lecture note.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ContentCard>
        <ResourceMetaFields
          value={meta}
          onChange={setMeta}
          errors={{}}
          subjectOptions={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          classLevelOptions={classLevels.map((level) => ({ value: level.id, label: level.name }))}
          termOptions={terms.map((term) => ({ value: term.id, label: term.name }))}
        />
      </ContentCard>

      <PasteToFill
        hint="Paste a note you've already typed up — label sections with Objectives: and References: if you have them."
        example={
          "Objectives: Explain the water cycle\n\nEvaporation is...\nCondensation is...\n\nReferences: JSS textbook, chapter 4"
        }
        onParse={(text) => {
          const parsed = parseLectureNote(text);
          setContent(parsed);
          notify.success("Parsed into objectives, content and references", {
            description: "Check it over before saving.",
          });
        }}
      />

      <ContentCard className="flex flex-col gap-4">
        <FormField id="objectives" label="Objectives" hint="What should the class be able to do by the end?">
          <Textarea
            {...controlProps("objectives")}
            rows={3}
            value={content.objectives}
            onChange={(event) => setContent({ ...content, objectives: event.target.value })}
          />
        </FormField>
        <FormField id="body" label="Lecture content" required>
          <Textarea
            {...controlProps("body")}
            rows={14}
            value={content.body}
            onChange={(event) => setContent({ ...content, body: event.target.value })}
          />
        </FormField>
        <FormField id="references" label="References">
          <Textarea
            {...controlProps("references")}
            rows={3}
            value={content.references}
            onChange={(event) => setContent({ ...content, references: event.target.value })}
          />
        </FormField>
      </ContentCard>

      <div>
        <AppButton type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save draft"}
        </AppButton>
      </div>
    </div>
  );
}
