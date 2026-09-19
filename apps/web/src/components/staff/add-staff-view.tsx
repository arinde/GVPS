"use client";

import { useState } from "react";
import { AddStaffForm } from "@/components/staff/add-staff-form";
import { cleanedStaff, EMPTY_STAFF, useStaffDraft } from "@/components/staff/use-staff-draft";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { useAppSelector } from "@/store/hooks";
import { useGetBanksQuery, useGetNextOfKinRelationshipsQuery } from "@/store/api/reference-api";
import { useCreateStaffMutation } from "@/store/api/staff-api";
import { selectAccessToken, selectMustChangePassword } from "@/store/slices/auth-slice";

type CreatedAccount = { name: string; email: string; temporaryPassword: string };

/**
 * PLAN.md §4.12: staff accounts are superadmin-only. The role check here is
 * UX only — decodeAccessToken doesn't verify anything, and the server
 * enforces this for real via RolesGuard regardless of what the client shows
 * (FEATURES.md §1.5). Signed-out visitors and temporary passwords are
 * redirected by AppShell, so there is no redirect effect here.
 */
export function AddStaffView() {
  const accessToken = useAppSelector(selectAccessToken);
  const mustChangePassword = useAppSelector(selectMustChangePassword);

  const { draft, setDraft, fieldErrors, setFieldErrors, patch, toggleRole } = useStaffDraft();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount>();
  const [createStaff, { isLoading }] = useCreateStaffMutation();
  const { data: banks = [] } = useGetBanksQuery();
  const { data: relationships = [] } = useGetNextOfKinRelationshipsQuery();

  async function handleSubmit() {
    setErrorMessage(undefined);
    try {
      const result = await createStaff(cleanedStaff(draft)).unwrap();
      const name = `${draft.firstName} ${draft.lastName}`;
      setCreatedAccount({ name, email: draft.email, temporaryPassword: result.temporaryPassword });
      setDraft(EMPTY_STAFF);
      setFieldErrors({});
      notify.success("Staff account created", { description: `Give ${name} their temporary password.` });
    } catch (error) {
      const parsed = notify.error(error, "Could not create the staff account.");
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    }
  }

  if (!accessToken || mustChangePassword) return null;

  const isSuperadmin = decodeAccessToken(accessToken)?.roles.includes("SUPERADMIN") ?? false;
  if (!isSuperadmin) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Not allowed</AlertTitle>
        <AlertDescription>Only a superadmin can create staff accounts.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {createdAccount ? (
        <Alert role="status">
          <AlertTitle>Account created for {createdAccount.name}</AlertTitle>
          <AlertDescription>
            Temporary password for {createdAccount.email}:{" "}
            <strong className="font-mono">{createdAccount.temporaryPassword}</strong>
            <br />
            Shown once — copy it now and hand it to them. They will be asked to change it at first sign-in.
          </AlertDescription>
        </Alert>
      ) : null}

      <AddStaffForm
        value={draft}
        banks={banks}
        relationships={relationships}
        onChange={patch}
        onRoleToggle={toggleRole}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
        errorMessage={errorMessage}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}
