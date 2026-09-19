"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { withoutFieldErrors } from "@/lib/api-error";
import { PORTAL_ROUTES } from "@/lib/auth-redirect";
import { notify } from "@/lib/notify";
import { validateChangePassword, type ChangePasswordDraft } from "@/lib/validate-change-password";
import { usePortalChangePasswordMutation } from "@/store/api/portal-api";
import { useAppDispatch } from "@/store/hooks";
import { clearPortalCredentials } from "@/store/slices/portal-auth-actions";

const EMPTY: ChangePasswordDraft = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * The parent replaces the slip's temporary password. As for staff, a change
 * signs out every session, this one included, so a fresh sign-in follows.
 */
export function PortalChangePasswordView() {
  const [draft, setDraft] = useState<ChangePasswordDraft>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string>();
  const [changePassword, { isLoading }] = usePortalChangePasswordMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  function update(field: keyof ChangePasswordDraft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((errors) => withoutFieldErrors(errors, [field]));
  }

  async function handleSubmit() {
    setErrorMessage(undefined);
    const localErrors = validateChangePassword(draft);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      setErrorMessage("Please correct the highlighted fields.");
      notify.warning("Please correct the highlighted fields.");
      return;
    }
    try {
      await changePassword({ currentPassword: draft.currentPassword, newPassword: draft.newPassword }).unwrap();
      notify.success("Password updated", { description: "Sign in with your new password." });
      dispatch(clearPortalCredentials());
      router.replace(PORTAL_ROUTES.login);
    } catch (error) {
      const parsed = notify.error(error, "Could not update the password.");
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    }
  }

  return (
    <ChangePasswordForm
      currentPassword={draft.currentPassword}
      newPassword={draft.newPassword}
      confirmPassword={draft.confirmPassword}
      onCurrentPasswordChange={(value) => update("currentPassword", value)}
      onNewPasswordChange={(value) => update("newPassword", value)}
      onConfirmPasswordChange={(value) => update("confirmPassword", value)}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      errorMessage={errorMessage}
      fieldErrors={fieldErrors}
    />
  );
}
