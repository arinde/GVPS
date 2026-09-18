import { MIN_PASSWORD_LENGTH } from "@/components/auth/change-password-form";

export type ChangePasswordDraft = { currentPassword: string; newPassword: string; confirmPassword: string };

/**
 * Checks the server would make anyway, run first so a mistake is flagged
 * beside the field instantly instead of after a round trip. The API still
 * validates — this only saves the wait.
 */
export function validateChangePassword(draft: ChangePasswordDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.currentPassword) errors.currentPassword = "Enter your current password";

  if (draft.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  } else if (draft.newPassword === draft.currentPassword) {
    errors.newPassword = "Choose a password different from the current one";
  }

  // A typo here is a lockout: the temporary password stops working the moment
  // this succeeds, and the only way back is a command-line reset.
  if (draft.confirmPassword !== draft.newPassword) {
    errors.confirmPassword = "Doesn't match the new password";
  }

  return errors;
}
