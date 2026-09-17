import type { FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ChangePasswordFormProps = {
  currentPassword: string;
  newPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
};

export function ChangePasswordForm({
  currentPassword,
  newPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: ChangePasswordFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => onCurrentPasswordChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          value={newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
        />
      </div>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
