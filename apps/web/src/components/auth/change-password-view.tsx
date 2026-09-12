"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { useChangePasswordMutation } from "@/store/api/auth-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCredentials, selectIsAuthenticated } from "@/store/slices/auth-slice";

/**
 * Changing the password revokes every refresh token for this staff member,
 * including the one behind the current session (auth.service.ts) — so the
 * access token in hand is left stale either way. Redirecting to a fresh
 * login is simpler and safer than trying to patch a token that was already
 * minted with mustChangePassword: true baked in.
 */
export function ChangePasswordView() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    // Synchronises the route with session state — not fetched data.
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  async function handleSubmit() {
    setErrorMessage(undefined);
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      dispatch(clearCredentials());
      router.push("/login");
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, "Could not update the password."));
    }
  }

  if (!isAuthenticated) return null;

  return (
    <ChangePasswordForm
      currentPassword={currentPassword}
      newPassword={newPassword}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      errorMessage={errorMessage}
    />
  );
}
