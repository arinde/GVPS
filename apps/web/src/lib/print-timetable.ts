import { ACTIVITY_COLOR, READING_COLOR, colorForSubject } from "@/lib/subject-color";
import { buildDayActions, isReadingPeriod, timeRange } from "@/lib/timetable-grid";
import { DAY_LABELS, type ArmGrid, type DayOfWeek, type StaffTimetable } from "@/store/api/timetable-api";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

const STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #282828; }
  h1 { font-size: 16px; margin: 0 0 4px; color: #152259; }
  h2 { font-size: 12px; margin: 20px 0 6px; color: #4f4f4f; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; table-layout: fixed; }
  th, td { border: 1px solid #dee6ec; padding: 5px 6px; text-align: center; vertical-align: middle; }
  th { background: #eef3f7; }
  td:first-child, th:first-child { text-align: left; }
  .muted { color: #4f4f4f; font-size: 9px; }
  .print-bar { margin-bottom: 16px; display: flex; gap: 8px; }
  .print-bar button { font-family: inherit; font-size: 13px; font-weight: 600; border-radius: 8px; padding: 6px 16px; border: none; cursor: pointer; background: #2d88d4; color: #fff; }
  @media print { .print-bar { display: none; } }
`;

function open(): Window | null {
  return window.open("", "_blank", "width=900,height=700");
}

function printBar(): string {
  return `<div class="print-bar"><button onclick="window.print()">Print / Save as PDF</button></div>`;
}

/**
 * Mirrors WeeklyTimetableGrid's own merge logic (same buildDayActions call)
 * so the printed page matches what's on screen — a document.write()'d window
 * has no Tailwind build, so colours are inlined from the same hex pairs the
 * live grid's classes resolve to (lib/subject-color.ts).
 */
function armRows(grid: ArmGrid): string {
  return grid.days
    .map((day) => {
      const actions = buildDayActions(grid, day);
      const cells = grid.periods
        .map((period) => {
          if (!period.isTeaching) return null; // rendered once below, not per day
          const action = actions.get(period.id);
          if (!action || action.type === "consumed") return null;

          if (action.type === "empty") {
            const reading = isReadingPeriod(period);
            if (reading) {
              return `<td style="background:${READING_COLOR.bgHex};color:${READING_COLOR.fgHex}">Reading period</td>`;
            }
            return `<td class="muted">—</td>`;
          }

          const range = timeRange(period, action.endTime);
          const colspan = action.span > 1 ? ` colspan="${action.span}"` : "";

          if (action.subjects.length > 1) {
            const lines = action.subjects
              .map((subject) => {
                const tint = subject.isActivity ? ACTIVITY_COLOR : colorForSubject(subject.subjectId);
                return `<div style="color:${tint.fgHex}">${escapeHtml(subject.subjectName)}${subject.staffId ? "" : "*"}</div>`;
              })
              .join("");
            return `<td${colspan}>${lines}<div class="muted">${range}</div></td>`;
          }

          const subject = action.subjects[0];
          const tint = subject.isActivity ? ACTIVITY_COLOR : colorForSubject(subject.subjectId);
          const tag = subject.isActivity ? "Activity" : action.span > 1 ? "Double" : "";
          return `<td${colspan} style="background:${tint.bgHex};color:${tint.fgHex}"><strong>${escapeHtml(
            subject.subjectName,
          )}</strong><div class="muted" style="color:inherit;opacity:.8">${range}${tag ? ` · ${tag}` : ""}${
            subject.staffId ? "" : " · no teacher yet"
          }</div></td>`;
        })
        .filter((cell): cell is string => cell !== null)
        .join("");
      return `<tr><th>${DAY_LABELS[day]}</th>${cells}</tr>`;
    })
    .join("");
}

// Breaks are identical every day and shown as a caption instead, so the
// header only lists teaching periods — matching armRows, which skips them too.
function armHeader(grid: ArmGrid): string {
  return grid.periods
    .filter((period) => period.isTeaching)
    .map(
      (period) => `<th>${escapeHtml(period.name)}<div class="muted">${period.startTime}–${period.endTime}</div></th>`,
    )
    .join("");
}

/** FEATURES.md §8.3 — per-arm printable timetable, built from the same grid (and colours) the builder shows. */
export function printArmTimetable(grid: ArmGrid): void {
  const win = open();
  if (!win) return;

  // Breaks are identical every day, so they're columns in the header but
  // collapsed out of the body rows above — shown once as a caption instead.
  const breaks = grid.periods.filter((period) => !period.isTeaching);

  win.document.write(`
    <!doctype html><html><head><meta charset="utf-8" /><title>Timetable — ${escapeHtml(grid.classLabel)}</title>
    <style>${STYLES}</style></head>
    <body>
      ${printBar()}
      <h1>${escapeHtml(grid.classLabel)}</h1>
      ${breaks.length ? `<p class="muted">Breaks: ${breaks.map((b) => `${escapeHtml(b.name)} (${b.startTime}–${b.endTime})`).join(", ")}</p>` : ""}
      <table>
        <thead><tr><th>Day</th>${armHeader(grid)}</tr></thead>
        <tbody>${armRows(grid)}</tbody>
      </table>
    </body></html>
  `);
  win.document.close();
  win.focus();
}

/** Plain-text version of a class's week, for sharing to WhatsApp or anywhere else that only takes text. */
export function armTimetableText(grid: ArmGrid): string {
  const lines = [`${grid.classLabel} — timetable`, ""];
  for (const day of grid.days) {
    const actions = buildDayActions(grid, day);
    const entries: string[] = [];
    for (const period of grid.periods) {
      if (!period.isTeaching) continue;
      const action = actions.get(period.id);
      if (!action || action.type === "consumed") continue;
      if (action.type === "empty") continue;
      const range = timeRange(period, action.endTime);
      if (action.subjects.length > 1) {
        entries.push(`  ${range} choice of: ${action.subjects.map((s) => s.subjectName).join(", ")}`);
        continue;
      }
      const subject = action.subjects[0];
      const tag = subject.isActivity ? " (activity)" : action.span > 1 ? " (double)" : "";
      entries.push(`  ${range} ${subject.subjectName}${tag}`);
    }
    lines.push(`${DAY_LABELS[day]}:`, ...(entries.length ? entries : ["  —"]), "");
  }
  return lines.join("\n").trim();
}

/** Feature-detected — Web Share API isn't on every browser, so callers hide the button rather than fail loudly. */
export function canShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Shares straight to whatever the OS share sheet offers — WhatsApp included — as plain text, no file to generate. */
export async function shareArmTimetable(grid: ArmGrid): Promise<void> {
  if (!canShare()) return;
  try {
    await navigator.share({ title: `${grid.classLabel} timetable`, text: armTimetableText(grid) });
  } catch (error) {
    // AbortError means the person backed out of the share sheet — not a failure worth a toast.
    if (error instanceof Error && error.name === "AbortError") return;
    throw error;
  }
}

/** FEATURES.md §8.3 — one teacher's personal timetable, one table per section they teach in. */
export function printStaffTimetable(teacherName: string, timetable: StaffTimetable): void {
  const win = open();
  if (!win) return;

  const sections = timetable.sections
    .map((section) => {
      const rows = section.periods
        .map((period) => {
          const cells = section.days
            .map((day: DayOfWeek) => {
              if (!period.isTeaching) return `<td class="muted">—</td>`;
              const slot = section.slots.find((s) => s.dayOfWeek === day && s.periodId === period.id);
              return `<td>${slot ? `${escapeHtml(slot.classLabel)}<div class="muted">${escapeHtml(slot.subjectName)}</div>` : ""}</td>`;
            })
            .join("");
          return `<tr><td>${escapeHtml(period.name)}<div class="muted">${period.startTime}–${period.endTime}</div></td>${cells}</tr>`;
        })
        .join("");
      return `
        <h2>${escapeHtml(section.section)}</h2>
        <table>
          <thead><tr><th>Period</th>${section.days.map((day: DayOfWeek) => `<th>${DAY_LABELS[day]}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    })
    .join("");

  win.document.write(`
    <!doctype html><html><head><meta charset="utf-8" /><title>Timetable — ${escapeHtml(teacherName)}</title>
    <style>${STYLES}</style></head>
    <body>
      ${printBar()}
      <h1>${escapeHtml(teacherName)}</h1>
      ${sections || "<p>No lessons scheduled yet.</p>"}
    </body></html>
  `);
  win.document.close();
  win.focus();
}
