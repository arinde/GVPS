import type { ComponentProps } from "react";
import { cn } from "cn";
import { FIELD_CLASSES } from "@/components/common/field-styles";
import { Input } from "@/components/ui/input";

export type TextInputProps = ComponentProps<typeof Input>;

/**
 * The app's text field: shadcn's Input dressed to the design system's field
 * spec (§10). Wraps rather than edits the generated component (AGENTS.md §6).
 * Use this, not ui/input, in feature code.
 */
export function TextInput({ className, ...props }: TextInputProps) {
  return <Input {...props} className={cn(FIELD_CLASSES, className)} />;
}
