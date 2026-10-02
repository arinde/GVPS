"use client";

import { useState } from "react";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { AppButton } from "@/components/common/app-button";
import { CheckboxGroup } from "@/components/common/checkbox-group";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { NativeSelect } from "@/components/common/native-select";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TextInput } from "@/components/common/text-input";
import { formatKobo, parseNairaToKobo } from "@/lib/money";
import { notify } from "@/lib/notify";
import { useListClassLevelsQuery, useGetCurrentPeriodQuery } from "@/store/api/academic-api";
import {
  useCreateFeeItemMutation,
  useListFeeItemsQuery,
  useListFeeStructureQuery,
  useSetFeeStructureItemMutation,
  type FeeStructureItem,
} from "@/store/api/fees-api";

type Row = { entry: FeeStructureItem; classLevelName: string; feeItemName: string };

/**
 * FEATURES.md §6.1 — the fee catalogue and what each class level owes this
 * term. Superadmin and bursar write; principal reads (FEATURES.md §14) — the
 * API enforces both regardless of what this screen shows.
 */
export function FeeStructureView() {
  const { data: period } = useGetCurrentPeriodQuery();
  const termId = period?.term?.id;
  const { data: levels = [] } = useListClassLevelsQuery();
  const { data: feeItems = [] } = useListFeeItemsQuery();
  const { data: structure = [] } = useListFeeStructureQuery(termId ?? "", { skip: !termId });

  const [newItemName, setNewItemName] = useState("");
  const [createItem, creatingItem] = useCreateFeeItemMutation();

  const [classLevelId, setClassLevelId] = useState("");
  const [feeItemId, setFeeItemId] = useState("");
  const [amountText, setAmountText] = useState("");
  const [isCompulsory, setIsCompulsory] = useState(true);
  const [error, setError] = useState<string>();
  const [setStructureItem, settingItem] = useSetFeeStructureItemMutation();

  async function addFeeItem() {
    const name = newItemName.trim();
    if (!name) return;
    try {
      await createItem(name).unwrap();
      notify.success(`"${name}" added to the fee catalogue`);
      setNewItemName("");
    } catch (submitError) {
      notify.error(submitError, `Could not add "${name}".`);
    }
  }

  async function saveStructureItem() {
    if (!termId) return;
    setError(undefined);
    if (!classLevelId || !feeItemId) return setError("Choose a class level and a fee item.");

    const amountKobo = parseNairaToKobo(amountText);
    if (amountKobo === null || amountKobo <= 0) return setError("Enter a valid amount greater than zero.");

    try {
      await setStructureItem({ termId, classLevelId, feeItemId, amountKobo, isCompulsory }).unwrap();
      const levelName = levels.find((level) => level.id === classLevelId)?.name ?? "class";
      const itemName = feeItems.find((item) => item.id === feeItemId)?.name ?? "fee";
      notify.success(`${itemName} set for ${levelName}`, { description: formatKobo(amountKobo) });
      setAmountText("");
    } catch (submitError) {
      setError(notify.error(submitError, "Could not save this fee structure entry.").message);
    }
  }

  const levelName = new Map(levels.map((level) => [level.id, level.name]));
  const itemName = new Map(feeItems.map((item) => [item.id, item.name]));
  const rows: Row[] = structure.map((entry) => ({
    entry,
    classLevelName: levelName.get(entry.classLevelId) ?? "—",
    feeItemName: itemName.get(entry.feeItemId) ?? "—",
  }));

  const helper = createColumnHelper<StockFeatures, Row>();
  const columns = [
    helper.accessor((row) => row.classLevelName, { id: "level", header: "Class level" }),
    helper.accessor((row) => row.feeItemName, { id: "item", header: "Fee item" }),
    helper.accessor((row) => formatKobo(row.entry.amountKobo), { id: "amount", header: "Amount" }),
    helper.accessor((row) => (row.entry.isCompulsory ? "Compulsory" : "Optional"), { id: "compulsory", header: "" }),
  ] as ColumnDef<StockFeatures, Row, unknown>[];

  return (
    <PageContainer>
      <PageHeader title="Fee structure" subtitle={period?.term?.name} />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <h2 className="mb-4 text-base">Fee catalogue</h2>
          <div className="flex items-end gap-3">
            <TextInput
              aria-label="New fee item name"
              placeholder="e.g. Development Levy"
              value={newItemName}
              onChange={(event) => setNewItemName(event.target.value)}
              className="max-w-xs"
            />
            <AppButton type="button" onClick={addFeeItem} disabled={creatingItem.isLoading || !newItemName.trim()}>
              Add fee item
            </AppButton>
          </div>
          {/* STITCH-GLOBAL.md §13: a disabled button must say why, visibly, not just dim. */}
          {!newItemName.trim() ? (
            <p className="text-muted-foreground mt-2 text-xs">Type a name above to add it.</p>
          ) : null}
          {feeItems.length > 0 ? (
            <p className="text-muted-foreground mt-3 text-xs">{feeItems.map((item) => item.name).join(", ")}</p>
          ) : null}
        </ContentCard>

        <ContentCard>
          <h2 className="mb-4 text-base">Set an amount</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NativeSelect
              aria-label="Class level"
              placeholder="Class level…"
              value={classLevelId}
              onChange={(event) => setClassLevelId(event.target.value)}
              options={levels.map((level) => ({ value: level.id, label: level.name }))}
            />
            <NativeSelect
              aria-label="Fee item"
              placeholder="Fee item…"
              value={feeItemId}
              onChange={(event) => setFeeItemId(event.target.value)}
              options={feeItems.map((item) => ({ value: item.id, label: item.name }))}
            />
            <TextInput
              aria-label="Amount in naira"
              placeholder="Amount (₦)"
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
            />
            <CheckboxGroup
              id="fee-compulsory"
              legend=""
              options={[{ value: "compulsory", label: "Compulsory" }]}
              selected={isCompulsory ? ["compulsory"] : []}
              onToggle={(_value, checked) => setIsCompulsory(checked)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-destructive mt-2 text-xs">
              {error}
            </p>
          ) : null}
          <AppButton
            type="button"
            className="mt-4"
            onClick={saveStructureItem}
            disabled={settingItem.isLoading || !termId}
          >
            {settingItem.isLoading ? "Saving…" : "Save"}
          </AppButton>
          {!termId && !settingItem.isLoading ? (
            <p className="text-muted-foreground mt-2 text-xs">Loading the current term…</p>
          ) : null}
        </ContentCard>

        <ContentCard flush>
          <DataTable
            columns={columns}
            data={rows}
            emptyTitle="No fee structure set yet"
            emptyDescription="Add a fee item above, then set its amount per class level."
          />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
