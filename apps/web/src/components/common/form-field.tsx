import type { ReactNode } from "react";
import { cn } from "cn";
import { Label } from "@/components/ui/label";

/**
 * Label, control and message in one place, so every form in the app spaces
 * and announces its fields identically (AGENTS.md §1).
 *
 * `error` is wired to the control through aria-describedby by the caller
 * passing the same `id` — the message carries role="alert" so a screen reader
 * hears it when it appears.
 */
export type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function FormField({ id, label, required = false, hint, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
