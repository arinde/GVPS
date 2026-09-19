import type { FormEvent } from "react";
import { controlProps, FormField } from "@/components/common/form-field";
import { PasswordInput } from "@/components/common/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppButton } from "@/components/common/app-button";

export const MIN_PASSWORD_LENGTH = 10;

export type ChangePasswordFormProps = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
  /** Keyed by field name: currentPassword, newPassword, confirmPassword. */
  fieldErrors?: Record<string, string>;
};

export function ChangePasswordForm({
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  fieldErrors = {},
}: ChangePasswordFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  // Live count so the length rule is visible while typing, not discovered on
  // submit.
  const remaining = MIN_PASSWORD_LENGTH - newPassword.length;
  const newPasswordHint =
    newPassword.length === 0
      ? `At least ${MIN_PASSWORD_LENGTH} characters`
      : remaining > 0
        ? `${remaining} more character${remaining === 1 ? "" : "s"} needed`
        : "Long enough";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="current-password" label="Current password" required error={fieldErrors.currentPassword}>
        <PasswordInput
          {...controlProps("current-password", fieldErrors.currentPassword)}
          autoComplete="current-password"
          value={currentPassword}
          disabled={isSubmitting}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
        />
      </FormField>

      <FormField id="new-password" label="New password" required hint={newPasswordHint} error={fieldErrors.newPassword}>
        <PasswordInput
          {...controlProps("new-password", fieldErrors.newPassword, newPasswordHint)}
          autoComplete="new-password"
          value={newPassword}
          disabled={isSubmitting}
          onChange={(event) => onNewPasswordChange(event.target.value)}
        />
      </FormField>

      <FormField id="confirm-password" label="Confirm new password" required error={fieldErrors.confirmPassword}>
        <PasswordInput
          {...controlProps("confirm-password", fieldErrors.confirmPassword)}
          autoComplete="new-password"
          value={confirmPassword}
          disabled={isSubmitting}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
        />
      </FormField>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <AppButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update password"}
      </AppButton>
    </form>
  );
}
