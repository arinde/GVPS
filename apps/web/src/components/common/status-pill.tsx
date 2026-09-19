import { cn } from "cn";

const TONES = {
  success: "bg-success text-success-foreground border-success-border",
  warning: "bg-warning text-warning-foreground border-warning-border",
  danger: "bg-danger text-danger-foreground border-danger-border",
  info: "bg-info text-info-foreground border-info-border",
} as const;

// §11: the shape carries the meaning as well as the colour, so status survives
// photocopying, poor light and colour blindness.
const SHAPES = {
  circle: "rounded-full bg-current", // Approved / Paid / Active
  diamond: "rotate-45 bg-current", // Pending / Submitted / Warning
  square: "bg-current", // Blocked / Overdue / Suspended
  hollow: "rounded-full border-[1.5px] border-current", // Reviewing / Waiting
} as const;

export type StatusPillProps = {
  tone: keyof typeof TONES;
  shape: keyof typeof SHAPES;
  children: string;
};

/** STITCH-GLOBAL.md §11: 24px pill, 20px radius, a 6px shape left of the word. */
export function StatusPill({ tone, shape, children }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-[20px] border py-0.5 pr-2.5 pl-2 text-[10px] font-semibold whitespace-nowrap",
        TONES[tone],
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0", SHAPES[shape])} />
      {children}
    </span>
  );
}
