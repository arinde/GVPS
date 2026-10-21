import type { ComponentProps } from "react";
import { cn } from "cn";
import { FIELD_CLASSES } from "@/components/common/field-styles";
import { Textarea as TextareaPrimitive } from "@/components/ui/textarea";

export type TextareaProps = ComponentProps<typeof TextareaPrimitive>;

/**
 * The app's multi-line field: shadcn's Textarea dressed to match TextInput.
 * Wraps rather than edits the generated component (AGENTS.md §6).
 */
export function Textarea({ className, ...props }: TextareaProps) {
  return <TextareaPrimitive {...props} className={cn(FIELD_CLASSES, "h-auto min-h-16 py-2", className)} />;
}
