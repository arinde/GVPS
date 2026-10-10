import { DAYS, DAY_LABELS, type ArmGrid, type StaffTimetable } from "@/store/api/timetable-api";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

const STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #282828; }
  h1 { font-size: 16px; margin: 0 0 4px; color: #152259; }
  h2 { font-size: 12px; margin: 20px 0 6px; color: #4f4f4f; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
  th, td { border: 1px solid #dee6ec; padding: 5px 6px; text-align: left; }
  th { background: #eef3f7; }
  .muted { color: #4f4f4f; font-size: 9px; }
  .print-bar { margin-bottom: 16px; }
  .print-bar button { font-family: inherit; font-size: 13px; font-weight: 600; border-radius: 8px; padding: 6px 16px; border: none; cursor: pointer; background: #2d88d4; color: #fff; }
  @media print { .print-bar { display: none; } }
`;

function open(): Window | null {
  return window.open("", "_blank", "width=900,height=700");
}

function printBar(): string {
  return `<div class="print-bar"><button onclick="window.print()">Print</button></div>`;
}

/** FEATURES.md §8.3 — per-arm printable timetable, built from the same grid the builder shows. */
export function printArmTimetable(grid: ArmGrid): void {
  const win = open();
  if (!win) return;

  const rows = grid.periods
    .map((period) => {
      const cells = DAYS.map((day) => {
        if (!period.isTeaching) return `<td class="muted">—</td>`;
        const slot = grid.slots.find((s) => s.dayOfWeek === day && s.periodId === period.id);
        return `<td>${slot ? `${escapeHtml(slot.subjectName)}<div class="muted">${escapeHtml(slot.staffName)}</div>` : ""}</td>`;
      }).join("");
      return `<tr><td>${escapeHtml(period.name)}<div class="muted">${period.startTime}–${period.endTime}</div></td>${cells}</tr>`;
    })
    .join("");

  win.document.write(`
    <!doctype html><html><head><meta charset="utf-8" /><title>Timetable — ${escapeHtml(grid.classLabel)}</title>
    <style>${STYLES}</style></head>
    <body>
      ${printBar()}
      <h1>${escapeHtml(grid.classLabel)}</h1>
      <table>
        <thead><tr><th>Period</th>${DAYS.map((day) => `<th>${DAY_LABELS[day]}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>
  `);
  win.document.close();
  win.focus();
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
            .map((day) => {
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
          <thead><tr><th>Period</th>${section.days.map((day) => `<th>${DAY_LABELS[day]}</th>`).join("")}</tr></thead>
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
