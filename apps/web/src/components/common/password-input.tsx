"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { TextInput } from "@/components/common/text-input";

export type PasswordInputProps = Omit<ComponentProps<typeof TextInput>, "type">;

/**
 * A password field with a show/hide toggle, built on TextInput so it matches
 * every other field. Every password field in the app uses this one component.
 *
 * Revealing matters more here than in most apps: staff type temporary
 * passwords read off a printed slip or a colleague's screen, often on a phone,
 * and a hidden typo means a failed login and eventually a lockout.
 *
 * Visibility is local UI state — it belongs to this one field and nothing
 * else needs to know it, so useState rather than a store (AGENTS.md §2–3).
 */
export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <TextInput
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
