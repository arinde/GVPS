import type { FormEvent } from "react";
import { ROLE_OPTIONS } from "@/components/auth/roles";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddStaffFormProps = {
  email: string;
  selectedRoles: string[];
  onEmailChange: (value: string) => void;
  onRoleToggle: (role: string, checked: boolean) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
};

export function AddStaffForm({
  email,
  selectedRoles,
  onEmailChange,
  onRoleToggle,
  onSubmit,
  isSubmitting = false,
  errorMessage,
}: AddStaffFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="staff-email">Email</Label>
        <Input
          id="staff-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Roles</legend>
        {ROLE_OPTIONS.map((role) => (
          <Label key={role.value} htmlFor={`role-${role.value}`} className="font-normal">
            <Checkbox
              id={`role-${role.value}`}
              checked={selectedRoles.includes(role.value)}
              onCheckedChange={(checked) => onRoleToggle(role.value, checked)}
            />
            {role.label}
          </Label>
        ))}
      </fieldset>

      {errorMessage ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={isSubmitting || selectedRoles.length === 0}>
        {isSubmitting ? "Creating…" : "Create staff account"}
      </Button>
    </form>
  );
}
