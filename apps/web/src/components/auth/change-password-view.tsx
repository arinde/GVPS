"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import { validateChangePassword, type ChangePasswordDraft } from "@/lib/validate-change-password";
import { useChangePasswordMutation } from "@/store/api/auth-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCredentials, selectIsAuthenticated } from "@/store/slices/auth-slice";

const EMPTY: ChangePasswordDraft = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * Changing the password revokes every refresh token for this staff member,
 * including the one behind the current session (auth.service.ts), so a fresh
 * sign-in follows. The toast tells them why they are back at the login page
 * rather than leaving them to wonder whether it worked.
 *
 * Signed-out visitors are redirected by AppShell, so there is no redirect
 * effect here.
 */
export function ChangePasswordView() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [draft, setDraft] = useState<ChangePasswordDraft>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string>();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  function update(field: keyof ChangePasswordDraft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }));
    // Clear only the field being corrected, so the other errors stay visible.
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
      dispatch(clearCredentials());
      router.replace("/login");
    } catch (error) {
      const parsed = notify.error(error, "Could not update the password.");
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    }
  }

  if (!isAuthenticated) return null;

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
