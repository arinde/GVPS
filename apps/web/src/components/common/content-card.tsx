import type { ReactNode } from "react";
import { cn } from "cn";

export type ContentCardProps = {
  /** Omit the padding when a table fills the card edge to edge. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * STITCH-GLOBAL.md §4: white card, #DEE6EC border, 12px corners, 20px padding,
 * and at most the faint shadow §2 allows.
 */
export function ContentCard({ flush = false, className, children }: ContentCardProps) {
  return (
    <div
      className={cn(
        "border-border overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
        !flush && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
