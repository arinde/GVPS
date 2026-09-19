import type { FormEvent } from "react";
import { FormField } from "@/components/common/form-field";
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
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
};

export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: LoginFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="login-email" label="Email">
        <TextInput
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          disabled={isSubmitting}
          onChange={(event) => onEmailChange(event.target.value)}
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
