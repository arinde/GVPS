import { Loader2 } from "lucide-react";
import { cn } from "cn";

const SIZES = { small: "size-4", default: "size-6", large: "size-10" } as const;

export type SpinnerProps = { size?: keyof typeof SIZES; className?: string };

/** Presentational only (AGENTS.md §1). The spin itself is the loading signal — decorative, so it's hidden from screen readers. */
export function Spinner({ size = "default", className }: SpinnerProps) {
  return <Loader2 aria-hidden="true" className={cn("text-primary animate-spin", SIZES[size], className)} />;
}

export type LoadingStateProps = { label?: string; size?: SpinnerProps["size"]; className?: string };

/**
 * The one way a screen says "this is still loading" (AGENTS.md §12 — every
 * action gets feedback). `role="status"` plus the visible label is what a
 * screen reader announces; the spin is just the sighted reinforcement.
 */
export function LoadingState({ label = "Loading…", size = "default", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn("text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm", className)}
    >
      <Spinner size={size} />
      <span>{label}</span>
    </div>
  );
}
