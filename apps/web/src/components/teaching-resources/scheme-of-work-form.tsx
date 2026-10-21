"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { FormField, controlProps } from "@/components/common/form-field";
import { Textarea } from "@/components/common/textarea";
import { TextInput } from "@/components/common/text-input";
import { PasteToFill } from "@/components/teaching-resources/paste-to-fill";
import { ResourceMetaFields, type ResourceMeta } from "@/components/teaching-resources/resource-meta-fields";
import { notify } from "@/lib/notify";
import { parseSchemeOfWork } from "@/lib/parse-teaching-resource";
import { useListClassLevelsQuery, useListSessionsQuery } from "@/store/api/academic-api";
import { useListSubjectsQuery } from "@/store/api/subjects-api";
import {
  useCreateTeachingResourceMutation,
  useUpdateTeachingResourceMutation,
  type SchemeOfWorkWeek,
  type TeachingResource,
} from "@/store/api/teaching-resources-api";

const EMPTY_WEEK = (week: number): SchemeOfWorkWeek => ({
  week,
  topic: "",
  objectives: "",
  activities: "",
  resources: "",
});

export type SchemeOfWorkFormProps = { resource?: TeachingResource & { content: { weeks: SchemeOfWorkWeek[] } } };

/** FEATURES.md — a term's scheme of work: topic, objectives, activities and resources, week by week. */
export function SchemeOfWorkForm({ resource }: SchemeOfWorkFormProps) {
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
  const [weeks, setWeeks] = useState<SchemeOfWorkWeek[]>(resource?.content.weeks ?? [EMPTY_WEEK(1)]);
  const [create, { isLoading: creating }] = useCreateTeachingResourceMutation();
  const [update, { isLoading: updating }] = useUpdateTeachingResourceMutation();
  const saving = creating || updating;

  function updateWeek(index: number, patch: Partial<SchemeOfWorkWeek>) {
    setWeeks((current) => current.map((week, i) => (i === index ? { ...week, ...patch } : week)));
  }

  async function handleSave() {
    if (!meta.title.trim() || !meta.subjectId || !meta.classLevelId || !meta.termId) {
      notify.warning("Fill in the title, subject, class and term first.");
      return;
    }
    if (weeks.some((week) => !week.topic.trim())) {
      notify.warning("Every week needs a topic.");
      return;
    }

    const body = { type: "SCHEME_OF_WORK" as const, ...meta, content: { weeks } };
    try {
      const saved = resource ? await update({ id: resource.id, body }).unwrap() : await create(body).unwrap();
      notify.success(resource ? "Scheme of work updated" : "Scheme of work saved as a draft");
      router.push(`/teaching-resources/${saved.id}`);
    } catch (error) {
      notify.error(error, "Could not save this scheme of work.");
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
        hint="Paste a scheme you've already typed up — one week per block, blank line between weeks."
        example={
          "Week 1: Introduction to Basic Science\nObjectives: Define basic science\nActivities: Class discussion\nResources: Textbook"
        }
        onParse={(text) => {
          const parsed = parseSchemeOfWork(text);
          setWeeks(parsed.weeks.length > 0 ? parsed.weeks : [EMPTY_WEEK(1)]);
          notify.success(`Parsed ${parsed.weeks.length} week${parsed.weeks.length === 1 ? "" : "s"}`, {
            description: "Check each one over before saving.",
          });
        }}
      />

      <div className="flex flex-col gap-4">
        {weeks.map((week, index) => (
          <ContentCard key={index} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base">Week {week.week}</h2>
              {weeks.length > 1 ? (
                <AppButton
                  type="button"
                  variant="ghost"
                  size="small"
                  aria-label={`Remove week ${week.week}`}
                  onClick={() => setWeeks((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2 aria-hidden="true" />
                </AppButton>
              ) : null}
            </div>
            <FormField id={`topic-${index}`} label="Topic" required>
              <TextInput
                {...controlProps(`topic-${index}`)}
                value={week.topic}
                onChange={(event) => updateWeek(index, { topic: event.target.value })}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField id={`objectives-${index}`} label="Objectives">
                <Textarea
                  {...controlProps(`objectives-${index}`)}
                  rows={3}
                  value={week.objectives}
                  onChange={(event) => updateWeek(index, { objectives: event.target.value })}
                />
              </FormField>
              <FormField id={`activities-${index}`} label="Activities">
                <Textarea
                  {...controlProps(`activities-${index}`)}
                  rows={3}
                  value={week.activities}
                  onChange={(event) => updateWeek(index, { activities: event.target.value })}
                />
              </FormField>
              <FormField id={`resources-${index}`} label="Resources">
                <Textarea
                  {...controlProps(`resources-${index}`)}
                  rows={3}
                  value={week.resources}
                  onChange={(event) => updateWeek(index, { resources: event.target.value })}
                />
              </FormField>
            </div>
          </ContentCard>
        ))}

        <div>
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => setWeeks((current) => [...current, EMPTY_WEEK(current.length + 1)])}
          >
            <Plus aria-hidden="true" />
            Add week
          </AppButton>
        </div>
      </div>

      <div>
        <AppButton type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save draft"}
        </AppButton>
      </div>
    </div>
  );
}
