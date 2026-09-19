import type { ReactNode } from "react";
import { cn } from "cn";

const WIDTHS = {
  /** Lists and tables: use the full content area (STITCH-GLOBAL.md §1). */
  full: "max-w-none",
  /** Forms: a readable line length, so a row of fields is not stretched. */
  form: "max-w-4xl",
} as const;

export type PageContainerProps = {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: ReactNode;
};

/**
 * The padding every page sits in: 16px gutters on a phone (§1), 40px beside
 * the sidebar on desktop.
 */
export function PageContainer({ width = "full", className, children }: PageContainerProps) {
  return (
    <div className={cn("w-full px-4 py-6 lg:px-10 lg:py-8", className)}>
      <div className={cn("w-full", WIDTHS[width])}>{children}</div>
    </div>
  );
}
