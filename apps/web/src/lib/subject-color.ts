// A stable colour per subject, drawn only from this app's existing status-tint
// tokens (STITCH-GLOBAL.md) — never a one-off hex — so the grid reads as
// colourful without introducing a second palette. "success" is reserved for
// a fixed-day activity (Sports, Fellowship, Clubs) and "muted" for breaks,
// so neither appears here. Each entry also carries its raw hex pair, used by
// print-timetable.ts — a document.write()'d window has no Tailwind build to
// resolve class names against, so the printed page needs the literal colours.
const SUBJECT_PALETTE = [
  { bg: "bg-info", fg: "text-info-foreground", bgHex: "#e5edf4", fgHex: "#3c5a78" },
  { bg: "bg-warning", fg: "text-warning-foreground", bgHex: "#f7eedc", fgHex: "#8a6316" },
  { bg: "bg-danger", fg: "text-danger-foreground", bgHex: "#f7e4e4", fgHex: "#9b2226" },
  { bg: "bg-stat-lavender", fg: "text-[#4338ca]", bgHex: "#e8e8ff", fgHex: "#4338ca" },
  { bg: "bg-primary", fg: "text-primary-foreground", bgHex: "#2d88d4", fgHex: "#ffffff" },
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}

export type SubjectTint = { bg: string; fg: string; bgHex: string; fgHex: string };

export function colorForSubject(subjectId: string): SubjectTint {
  return SUBJECT_PALETTE[hashString(subjectId) % SUBJECT_PALETTE.length];
}

export const ACTIVITY_COLOR: SubjectTint = {
  bg: "bg-success",
  fg: "text-success-foreground",
  bgHex: "#e4f0ea",
  fgHex: "#1f6b45",
};
export const READING_COLOR: SubjectTint = {
  bg: "bg-stat-lavender",
  fg: "text-[#4338ca]",
  bgHex: "#e8e8ff",
  fgHex: "#4338ca",
};
