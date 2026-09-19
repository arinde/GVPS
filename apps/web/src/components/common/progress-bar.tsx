import { cn } from "cn";

export type ProgressBarProps = {
  /** 0 to 1; values outside are clamped. */
  value: number;
  /** What is being measured, read out by screen readers: "Primary 3A registration". */
  label: string;
  className?: string;
};

/** STITCH-GLOBAL.md: an #EEF3F7 track with a primary fill, 6px tall and fully rounded. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("bg-canvas h-1.5 w-full overflow-hidden rounded-full", className)}
    >
      <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
    </div>
  );
}
