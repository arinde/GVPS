"use client";

import { useState } from "react";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { OfferLevelsForm, type OfferLevelsDraft } from "@/components/subjects/offer-levels-form";
import { offeringColumns } from "@/components/subjects/offering-columns";
import { notify } from "@/lib/notify";
import { useListClassLevelsQuery } from "@/store/api/academic-api";
import {
  useAddOfferingsMutation,
  useRemoveOfferingMutation,
  useUpdateOfferingMutation,
  type Subject,
  type SubjectOffering,
} from "@/store/api/subjects-api";

const EMPTY: OfferLevelsDraft = { classLevelIds: [], stream: "", isCore: true };

/** Where one subject is taught: the current offerings, and a form to add more. */
export function SubjectOfferingsEditor({ subject }: { subject: Subject }) {
  const { data: levels = [] } = useListClassLevelsQuery();
  const [addOfferings, adding] = useAddOfferingsMutation();
  const [updateOffering, updating] = useUpdateOfferingMutation();
  const [removeOffering, removing] = useRemoveOfferingMutation();
  // The unsaved choice of levels (AGENTS.md §2: local form state).
  const [draft, setDraft] = useState<OfferLevelsDraft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function toggle(levelId: string, checked: boolean) {
    setDraft((previous) => ({
      ...previous,
      classLevelIds: checked
        ? [...previous.classLevelIds, levelId]
        : previous.classLevelIds.filter((id) => id !== levelId),
    }));
    setErrors({});
  }

  function selectSection(levelIds: string[]) {
    setDraft((previous) => ({ ...previous, classLevelIds: [...new Set([...previous.classLevelIds, ...levelIds])] }));
    setErrors({});
  }

  async function add() {
    try {
      const { added } = await addOfferings({
        subjectId: subject.id,
        classLevelIds: draft.classLevelIds,
        isCore: draft.isCore,
        ...(draft.stream ? { stream: draft.stream } : {}),
      }).unwrap();
      notify.success(
        added ? `${subject.name} offered at ${added} more level${added === 1 ? "" : "s"}` : "Already offered there",
      );
      setDraft(EMPTY);
    } catch (error) {
      setErrors(notify.error(error, "Could not add those levels.").fieldErrors);
    }
  }

  async function changeType(offering: SubjectOffering, isCore: boolean) {
    try {
      await updateOffering({ id: offering.id, isCore, passMark: offering.passMark }).unwrap();
      notify.success(`${subject.name} is ${isCore ? "core" : "an elective"} at ${offering.classLevel.name}`);
    } catch (error) {
      notify.error(error, "Could not change it.");
    }
  }

  async function remove(offering: SubjectOffering) {
    try {
      await removeOffering(offering.id).unwrap();
      notify.success(`${subject.name} is no longer offered at ${offering.classLevel.name}`);
    } catch (error) {
      notify.error(error, "Could not remove that level.");
    }
  }

  const busyId = updating.isLoading
    ? updating.originalArgs?.id
    : removing.isLoading
      ? removing.originalArgs
      : undefined;

  return (
    <>
      <ContentCard flush>
        <h2 className="px-5 pt-5 pb-3 text-base">Offered at</h2>
        <DataTable
          columns={offeringColumns({ busyId, onTypeChange: changeType, onRemove: remove })}
          data={subject.offerings}
          emptyTitle="Not offered at any level yet"
          emptyDescription="Choose the levels below."
        />
      </ContentCard>

      <ContentCard>
        <h2 className="text-base">Offer at more levels</h2>
        <p className="text-muted-foreground mb-4 text-xs">
          Levels already offering it are skipped. Teachers are assigned from each teacher&apos;s staff profile.
        </p>
        <OfferLevelsForm
          levels={levels}
          value={draft}
          onToggleLevel={toggle}
          onSelectSection={selectSection}
          onChange={(patch) => setDraft((previous) => ({ ...previous, ...patch }))}
          onSubmit={add}
          errors={errors}
          isSubmitting={adding.isLoading}
        />
      </ContentCard>
    </>
  );
}
