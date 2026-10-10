"use client";

import { useState } from "react";
import { AppButton } from "@/components/common/app-button";
import { CheckboxGroup } from "@/components/common/checkbox-group";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TextInput } from "@/components/common/text-input";
import { SECTION_LABEL } from "@/components/subjects/subject-labels";
import { notify } from "@/lib/notify";
import {
  useCreatePeriodMutation,
  useDeletePeriodMutation,
  useListPeriodsQuery,
  useUpdatePeriodMutation,
  type Period,
  type Section,
} from "@/store/api/timetable-api";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";

const SECTION_OPTIONS = Object.entries(SECTION_LABEL).map(([value, label]) => ({ value, label }));
const EMPTY = { name: "", startTime: "", endTime: "", isTeaching: true };

/** FEATURES.md §8.1 — the daily period structure (teaching slots, breaks, assembly), per section. */
export function PeriodsView() {
  const [section, setSection] = useState<Section>("PRIMARY");
  const { data: periods = [], isLoading } = useListPeriodsQuery(section);
  const [create, creating] = useCreatePeriodMutation();
  const [update, updating] = useUpdatePeriodMutation();
  const [remove] = useDeletePeriodMutation();

  const [editingId, setEditingId] = useState<string>();
  const [draft, setDraft] = useState(EMPTY);

  function startEdit(period: Period) {
    setEditingId(period.id);
    setDraft({
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      isTeaching: period.isTeaching,
    });
  }
  function resetForm() {
    setEditingId(undefined);
    setDraft(EMPTY);
  }

  async function submit() {
    if (!draft.name.trim() || !draft.startTime || !draft.endTime) {
      notify.warning("Enter a name and both times.");
      return;
    }
    try {
      if (editingId) {
        await update({ periodId: editingId, ...draft }).unwrap();
        notify.success(`"${draft.name}" updated`);
      } else {
        await create({ section, ...draft }).unwrap();
        notify.success(`"${draft.name}" added`);
      }
      resetForm();
    } catch (error) {
      notify.error(error, "Could not save this period.");
    }
  }

  async function del(period: Period) {
    try {
      await remove(period.id).unwrap();
      notify.success(`"${period.name}" removed`);
    } catch (error) {
      notify.error(error, `Could not remove "${period.name}".`);
    }
  }

  const helper = createColumnHelper<StockFeatures, Period>();
  const columns = [
    helper.accessor("name", { header: "Period" }),
    helper.accessor((row) => `${row.startTime} – ${row.endTime}`, { id: "time", header: "Time" }),
    helper.accessor((row) => (row.isTeaching ? "Teaching" : "Break / assembly"), { id: "kind", header: "Kind" }),
    helper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <AppButton type="button" variant="ghost" size="small" onClick={() => startEdit(row.original)}>
            Edit
          </AppButton>
          <AppButton type="button" variant="danger" size="small" onClick={() => del(row.original)}>
            Remove
          </AppButton>
        </div>
      ),
    }),
  ] as ColumnDef<StockFeatures, Period, unknown>[];

  return (
    <PageContainer>
      <PageHeader title="Periods" subtitle="The daily structure each class's timetable is built from." />
      <div className="flex flex-col gap-5">
        <ContentCard>
          <NativeSelect
            aria-label="Section"
            value={section}
            onChange={(event) => {
              setSection(event.target.value as Section);
              resetForm();
            }}
            options={SECTION_OPTIONS}
            className="max-w-xs"
          />
        </ContentCard>

        <ContentCard>
          <h2 className="mb-4 text-base">{editingId ? "Edit period" : "Add a period"}</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <FormField id="period-name" label="Name">
              <TextInput
                {...controlProps("period-name")}
                placeholder="e.g. Period 1, Break"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </FormField>
            <FormField id="period-start" label="Start">
              <TextInput
                {...controlProps("period-start")}
                type="time"
                value={draft.startTime}
                onChange={(event) => setDraft({ ...draft, startTime: event.target.value })}
              />
            </FormField>
            <FormField id="period-end" label="End">
              <TextInput
                {...controlProps("period-end")}
                type="time"
                value={draft.endTime}
                onChange={(event) => setDraft({ ...draft, endTime: event.target.value })}
              />
            </FormField>
            <CheckboxGroup
              id="period-teaching"
              legend=""
              options={[{ value: "teaching", label: "This is a teaching period" }]}
              selected={draft.isTeaching ? ["teaching"] : []}
              onToggle={(_value, checked) => setDraft({ ...draft, isTeaching: checked })}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <AppButton type="button" onClick={submit} disabled={creating.isLoading || updating.isLoading}>
              {editingId ? "Save period" : "Add period"}
            </AppButton>
            {editingId ? (
              <AppButton type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </AppButton>
            ) : null}
          </div>
        </ContentCard>

        <ContentCard flush>
          <DataTable
            columns={columns}
            data={periods}
            isLoading={isLoading}
            emptyTitle="No periods set for this section"
            emptyDescription="Add the first period above — timetables for this section can't be built until at least one exists."
          />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
