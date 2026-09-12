"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddStaffForm } from "@/components/auth/add-staff-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { useCreateStaffMutation } from "@/store/api/auth-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken, selectMustChangePassword } from "@/store/slices/auth-slice";

type CreatedAccount = { email: string; temporaryPassword: string };

/**
 * PLAN.md §4.12: staff accounts are superadmin-only. The role check here is
 * UX only — decodeAccessToken doesn't verify anything, and the server
 * enforces this for real via RolesGuard regardless of what the client shows
 * (FEATURES.md §1.5).
 */
export function AddStaffView() {
  const accessToken = useAppSelector(selectAccessToken);
  const mustChangePassword = useAppSelector(selectMustChangePassword);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [createdAccount, setCreatedAccount] = useState<CreatedAccount>();
  const [createStaff, { isLoading }] = useCreateStaffMutation();

  useEffect(() => {
    // Synchronises the route with session/permission state — not fetched data.
    if (!accessToken) router.replace("/login");
    else if (mustChangePassword) router.replace("/change-password");
  }, [accessToken, mustChangePassword, router]);

  function toggleRole(role: string, checked: boolean) {
    setSelectedRoles((current) => (checked ? [...current, role] : current.filter((selected) => selected !== role)));
  }

  async function handleSubmit() {
    setErrorMessage(undefined);
    try {
      const result = await createStaff({ email, roles: selectedRoles }).unwrap();
      setCreatedAccount({ email, temporaryPassword: result.temporaryPassword });
      setEmail("");
      setSelectedRoles([]);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, "Could not create the staff account."));
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
        <Alert>
          <AlertTitle>Account created</AlertTitle>
          <AlertDescription>
            Temporary password for {createdAccount.email}: <strong>{createdAccount.temporaryPassword}</strong>
            <br />
            This is shown once — copy it now and hand it to the new staff member.
          </AlertDescription>
        </Alert>
      ) : null}

      <AddStaffForm
        email={email}
        selectedRoles={selectedRoles}
        onEmailChange={setEmail}
        onRoleToggle={toggleRole}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
        errorMessage={errorMessage}
      />
    </div>
  );
}
