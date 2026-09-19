import type { FormEvent } from "react";
import { controlProps, FormField } from "@/components/common/form-field";
import { PasswordInput } from "@/components/common/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppButton } from "@/components/common/app-button";
import { TextInput } from "@/components/common/text-input";

/**
 * Presentational only (AGENTS.md §1) — every field is controlled by props,
 * including keystroke-level state, so the container is the single source of
 * truth and this renders purely from what it's handed.
 */
export type LoginFormProps = {
  /** What identifies the account: an email for staff, a phone number for parents. */
  identifier: string;
  password: string;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
  /** Defaults suit the staff sign-in; the family portal passes a phone field. */
  identifierLabel?: string;
  identifierType?: "email" | "tel";
  identifierHint?: string;
};

export function LoginForm({
  identifier,
  password,
  onIdentifierChange,
  onPasswordChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
  identifierLabel = "Email",
  identifierType = "email",
  identifierHint,
}: LoginFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="login-id" label={identifierLabel} hint={identifierHint}>
        <TextInput
          {...controlProps("login-id", undefined, identifierHint)}
          type={identifierType}
          inputMode={identifierType === "tel" ? "tel" : "email"}
          autoComplete={identifierType === "tel" ? "tel" : "email"}
          required
          value={identifier}
          disabled={isSubmitting}
          onChange={(event) => onIdentifierChange(event.target.value)}
        />
      </FormField>

      <FormField id="login-password" label="Password">
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          required
          value={password}
          disabled={isSubmitting}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
      </FormField>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <AppButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </AppButton>
    </form>
  );
}
