"use client";

import { useState } from "react";
import { AddArmForm, type AddArmDraft } from "@/components/classes/add-arm-form";
import { classSetupColumns, type ClassRow } from "@/components/classes/class-setup-columns";
import { nextArmName } from "@/components/classes/next-arm-name";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { notify } from "@/lib/notify";
import {
  useCreateClassArmMutation,
  useListClassLevelsQuery,
  useUpdateClassArmMutation,
} from "@/store/api/academic-api";

const EMPTY: AddArmDraft = { levelId: "", name: "", capacity: "" };

/** "" is no size; otherwise a whole number 1–200, the range the API accepts. */
function parseCapacity(text: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, value: null };
  const value = Number(trimmed);
  return Number.isInteger(value) && value >= 1 && value <= 200 ? { ok: true, value } : { ok: false };
}

const CAPACITY_MESSAGE = "Class size must be a whole number from 1 to 200.";

/**
 * Class setup (FEATURES.md §2.2): add arms such as Primary 1B and set each
 * class's size, which the dashboard measures registration against. Levels
 * themselves are fixed — Creche to SSS 3 are seeded.
 */
export function ClassSetupView() {
  const { data: levels = [], isLoading } = useListClassLevelsQuery();
  const [createArm, creating] = useCreateClassArmMutation();
  const [updateArm, updating] = useUpdateClassArmMutation();
  const [draft, setDraft] = useState<AddArmDraft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rows: ClassRow[] = levels.flatMap((level) =>
    level.arms.map((arm) => ({
      id: arm.id,
      label: `${level.name}${arm.name}`,
      section: level.section,
      capacity: arm.capacity,
    })),
  );

  function change(patch: Partial<AddArmDraft>) {
    // Choosing a level suggests its next letter, so adding Primary 1C is two taps.
    const level = patch.levelId !== undefined ? levels.find((candidate) => candidate.id === patch.levelId) : null;
    const suggested = level ? { name: nextArmName(level.arms.map((arm) => arm.name)) } : {};
    setDraft((current) => ({ ...current, ...suggested, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  }

  async function submit() {
    const capacity = parseCapacity(draft.capacity);
    if (!capacity.ok) return setErrors({ capacity: CAPACITY_MESSAGE });

    const level = levels.find((candidate) => candidate.id === draft.levelId);
    const label = `${level?.name ?? ""}${draft.name.trim()}`;
    try {
      await createArm({
        levelId: draft.levelId,
        name: draft.name.trim(),
        ...(capacity.value ? { capacity: capacity.value } : {}),
      }).unwrap();
      notify.success(`${label} added`, { description: "It is now in registration and class allocation." });
      // Keep the level and size — the next arm usually shares both — and
      // suggest the letter after the one just added.
      const letter = draft.name.trim();
      const taken = [...(level?.arms.map((arm) => arm.name) ?? []), letter];
      setDraft((current) => ({ ...current, name: nextArmName(taken) }));
    } catch (error) {
      setErrors(notify.error(error, `Could not add ${label}.`).fieldErrors);
    }
  }

  async function commitCapacity(row: ClassRow, text: string) {
    const capacity = parseCapacity(text);
    if (!capacity.ok) return notify.warning(CAPACITY_MESSAGE, { description: `${row.label} was not changed.` });
    try {
      await updateArm({ armId: row.id, capacity: capacity.value }).unwrap();
      notify.success(capacity.value ? `${row.label} holds ${capacity.value}` : `${row.label} has no class size now`);
    } catch (error) {
      notify.error(error, `Could not change the size of ${row.label}.`);
    }
  }

  const columns = classSetupColumns({
    savingClassId: updating.isLoading ? updating.originalArgs?.armId : undefined,
    onCapacityCommit: commitCapacity,
  });

  return (
    <PageContainer>
      <PageHeader title="Classes" subtitle={`${rows.length} class${rows.length === 1 ? "" : "es"}, Creche to SSS 3`} />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <h2 className="mb-4 text-base">Add a class</h2>
          <AddArmForm
            levels={levels.map((level) => ({ value: level.id, label: level.name }))}
            value={draft}
            onChange={change}
            onSubmit={submit}
            isSubmitting={creating.isLoading}
            errors={errors}
          />
        </ContentCard>

        <ContentCard flush>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            emptyTitle="No classes yet"
            emptyDescription="Add the first class above."
          />
        </ContentCard>

        <p className="text-muted-foreground text-xs">
          Type a class size and press Enter or move on to save it. Leave it empty if the class has no fixed size.
        </p>
      </div>
    </PageContainer>
  );
}
