import type { ReactNode } from "react";
import { cn } from "cn";

const WASHES = { lavender: "bg-stat-lavender", yellow: "bg-stat-yellow" } as const;

export type StatCardProps = {
  label: string;
  value: string;
  /** A caption under the figure: "Primary 236 · Junior 118 · Senior 58". */
  detail?: ReactNode;
  /** STITCH-GLOBAL.md §8 allows only these two washes, alternating. */
  wash: keyof typeof WASHES;
  /** Optional, e.g. a ProgressBar between the figure and the caption. */
  children?: ReactNode;
};

/** STITCH-GLOBAL.md §8: dashboard only. 12px corners, no border, a light shadow. */
export function StatCard({ label, value, detail, wash, children }: StatCardProps) {
  return (
    <div className={cn("flex min-h-[120px] flex-col gap-1.5 rounded-xl p-4 shadow-sm", WASHES[wash])}>
      <p className="text-[13px] text-[#4F4F4F]">{label}</p>
      <p className="text-foreground text-[28px] font-bold tabular-nums">{value}</p>
      {children}
      {detail ? <p className="text-body mt-auto text-xs">{detail}</p> : null}
    </div>
  );
}
