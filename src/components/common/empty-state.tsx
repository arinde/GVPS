import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

/**
 * Presentational only — takes props, reads nothing (AGENTS.md §1).
 * Used by DataTable and by any list view with nothing to show yet.
 */
export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      {Icon ? <Icon className="text-muted-foreground mb-1 size-8" aria-hidden="true" /> : null}
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="text-muted-foreground max-w-sm text-sm">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
