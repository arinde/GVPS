"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLinkButton } from "@/components/common/app-button";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { AddStaffForm } from "@/components/staff/add-staff-form";
import { cleanedStaff, useStaffDraft } from "@/components/staff/use-staff-draft";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notify } from "@/lib/notify";
import { staffName } from "@/lib/staff-name";
import { useGetBanksQuery, useGetNextOfKinRelationshipsQuery } from "@/store/api/reference-api";
import {
  useGetStaffProfileQuery,
  useUpdateStaffMutation,
  type CreateStaffRequest,
  type StaffProfile,
} from "@/store/api/staff-api";

/** The saved record as a form draft: nulls become empty fields. */
function toDraft(profile: StaffProfile): CreateStaffRequest {
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    otherNames: profile.otherNames ?? "",
    phone: profile.phone ?? "",
    email: profile.email,
    address: profile.address ?? "",
    nextOfKinName: profile.nextOfKinName ?? "",
    nextOfKinRelationship: profile.nextOfKinRelationship ?? "",
    nextOfKinPhone: profile.nextOfKinPhone ?? "",
    bankName: profile.bankName ?? "",
    accountNumber: profile.accountNumber ?? "",
    accountName: profile.accountName ?? "",
    roles: profile.roles.map(({ role }) => role),
  };
}

/** The form, once the record has loaded. Keyed on the staff id by the caller. */
function EditStaffForm({ profile }: { profile: StaffProfile }) {
  const router = useRouter();
  const { draft, fieldErrors, setFieldErrors, patch, toggleRole } = useStaffDraft(toDraft(profile));
  const [errorMessage, setErrorMessage] = useState<string>();
  const [updateStaff, { isLoading }] = useUpdateStaffMutation();
  const { data: banks = [] } = useGetBanksQuery();
  const { data: relationships = [] } = useGetNextOfKinRelationshipsQuery();

  async function save() {
    setErrorMessage(undefined);
    try {
      const { changed } = await updateStaff({ staffId: profile.id, details: cleanedStaff(draft) }).unwrap();
      notify.success(changed ? `Saved ${draft.firstName} ${draft.lastName}'s details` : "Nothing had changed");
      router.push(`/staff/${profile.id}`);
    } catch (error) {
      const parsed = notify.error(error, "Could not save these details.");
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    }
  }

  return (
    <AddStaffForm
      value={draft}
      banks={banks}
      relationships={relationships}
      onChange={patch}
      onRoleToggle={toggleRole}
      onSubmit={save}
      isSubmitting={isLoading}
      errorMessage={errorMessage}
      fieldErrors={fieldErrors}
      submitLabel="Save changes"
      submittingLabel="Saving…"
    />
  );
}

/**
 * The superadmin correcting a staff record. The API is superadmin-only and
 * writes each change, with before and after, to the audit log.
 */
export function EditStaffView({ staffId }: { staffId: string }) {
  const { data: profile, isLoading, isError } = useGetStaffProfileQuery(staffId);

  return (
    <PageContainer width="form">
      <PageHeader
        title={profile ? `Edit ${staffName(profile)}` : "Edit staff details"}
        subtitle="Changes are recorded in the audit log, with what they were before."
        actions={
          <AppLinkButton href={`/staff/${staffId}`} variant="secondary">
            Cancel
          </AppLinkButton>
        }
      />
      {isLoading ? (
        <p className="text-muted-foreground text-sm" role="status">
          Loading…
        </p>
      ) : isError || !profile ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            This staff member could not be found, or only the superadmin can edit them.
          </AlertDescription>
        </Alert>
      ) : (
        <EditStaffForm key={profile.id} profile={profile} />
      )}
    </PageContainer>
  );
}
