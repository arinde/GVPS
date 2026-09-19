import type { ReactNode } from "react";
import { cn } from "cn";

export type DetailItem = {
  label: string;
  /** Left out when empty, so a record shows what is known, not a column of dashes. */
  value: ReactNode;
  /** Codes such as admission and account numbers. */
  mono?: boolean;
};

/**
 * Label-and-value rows for a read-only record (STITCH-SCREENS.md screen 5):
 * caption label on the left, value on the right, a #DEE6EC rule between rows.
 */
export function DetailList({ items }: { items: DetailItem[] }) {
  const shown = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== "");
  return (
    <dl className="flex flex-col">
      {shown.map((item) => (
        <div
          key={item.label}
          className="border-border flex items-start justify-between gap-4 border-b py-2 last:border-b-0"
        >
          <dt className="text-muted-foreground shrink-0 text-xs">{item.label}</dt>
          <dd
            className={cn("text-foreground text-right text-sm font-medium", item.mono && "tabular font-mono text-xs")}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
