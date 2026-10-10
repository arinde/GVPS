"use client";

import { useState } from "react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { FormField, controlProps } from "@/components/common/form-field";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { TextInput } from "@/components/common/text-input";
import { notify } from "@/lib/notify";
import {
  useGetSchoolProfileQuery,
  useUpdateSchoolProfileMutation,
  type SchoolProfile,
} from "@/store/api/school-profile-api";

/** Container: the school's details as they appear on every receipt. Superadmin edits; others never reach this page. */
export function SchoolProfileView() {
  const { data, isLoading, isError } = useGetSchoolProfileQuery();

  return (
    <PageContainer width="form">
      <PageHeader title="School details" subtitle="Printed on every receipt." />
      {isLoading ? (
        <p className="text-muted-foreground text-sm" role="status">
          Loading…
        </p>
      ) : isError || !data ? (
        <ContentCard>
          <p className="text-sm">The school details could not be loaded.</p>
        </ContentCard>
      ) : (
        <SchoolProfileForm initial={data} />
      )}
    </PageContainer>
  );
}

type SchoolProfileFormProps = { initial: SchoolProfile };

/** Mounted only once the details have loaded, so the draft starts from the saved values. */
function SchoolProfileForm({ initial }: SchoolProfileFormProps) {
  const [draft, setDraft] = useState<SchoolProfile>(initial);
  const [save, saving] = useUpdateSchoolProfileMutation();

  function patch(change: Partial<SchoolProfile>) {
    setDraft((current) => ({ ...current, ...change }));
  }

  async function submit() {
    if (draft.name.trim().length < 2) {
      notify.warning("Enter the school's name.");
      return;
    }
    try {
      await save({
        ...draft,
        name: draft.name.trim(),
        address: draft.address?.trim() || null,
        phone: draft.phone?.trim() || null,
        email: draft.email?.trim() || null,
        taxNumber: draft.taxNumber?.trim() || null,
      }).unwrap();
      notify.success("School details saved", { description: "New receipts will show these details." });
    } catch (error) {
      notify.error(error, "Could not save the school details.");
    }
  }

  return (
    <ContentCard className="flex flex-col gap-4">
      <FormField id="school-name" label="School name" required>
        <TextInput
          {...controlProps("school-name")}
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </FormField>
      <FormField id="school-address" label="Address">
        <TextInput
          {...controlProps("school-address")}
          value={draft.address ?? ""}
          onChange={(e) => patch({ address: e.target.value })}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="school-phone" label="Phone">
          <TextInput
            {...controlProps("school-phone")}
            inputMode="tel"
            value={draft.phone ?? ""}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </FormField>
        <FormField id="school-email" label="Email">
          <TextInput
            {...controlProps("school-email")}
            type="email"
            value={draft.email ?? ""}
            onChange={(e) => patch({ email: e.target.value })}
          />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="school-tax" label="Tax identification number" hint="Optional. Printed on receipts.">
          <TextInput
            {...controlProps("school-tax", undefined, "Optional. Printed on receipts.")}
            value={draft.taxNumber ?? ""}
            onChange={(e) => patch({ taxNumber: e.target.value })}
          />
        </FormField>
        <FormField
          id="school-vat"
          label="VAT rate (%)"
          hint="0 means no VAT is charged. Set it only if your accountant confirms the school charges VAT."
        >
          <TextInput
            {...controlProps(
              "school-vat",
              undefined,
              "0 means no VAT is charged. Set it only if your accountant confirms the school charges VAT.",
            )}
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={String(draft.vatRatePercent)}
            onChange={(e) => patch({ vatRatePercent: Number(e.target.value) || 0 })}
          />
        </FormField>
      </div>
      <div>
        <AppButton type="button" onClick={submit} disabled={saving.isLoading}>
          {saving.isLoading ? "Saving…" : "Save school details"}
        </AppButton>
      </div>
    </ContentCard>
  );
}
