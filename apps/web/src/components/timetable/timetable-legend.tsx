const ITEMS = [
  { label: "Subject", className: "bg-info" },
  { label: "Activity", className: "bg-success" },
  { label: "Reading period", className: "bg-stat-lavender" },
  { label: "Break", className: "bg-muted" },
] as const;

/** STITCH-GLOBAL.md-style key for WeeklyTimetableGrid's cell tints — colour never carries meaning alone (AGENTS.md §12). */
export function TimetableLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {ITEMS.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${item.className}`} />
          <span className="text-muted-foreground">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
