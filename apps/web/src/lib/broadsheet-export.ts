import type { Broadsheet } from "@/store/api/broadsheet-api";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #282828; }
  h1 { font-size: 16px; margin: 0 0 4px; color: #152259; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #dee6ec; padding: 4px 6px; text-align: center; }
  th { background: #eef3f7; }
  td:nth-child(1), td:nth-child(2) { text-align: left; }
  .print-bar { margin-bottom: 16px; }
  .print-bar button { font-family: inherit; font-size: 13px; font-weight: 600; border-radius: 8px; padding: 6px 16px; border: none; cursor: pointer; background: #2d88d4; color: #fff; }
  @media print { .print-bar { display: none; } }
`;

/** FEATURES.md §5.9 — printable broadsheet, same table the screen shows. */
export function printBroadsheet(sheet: Broadsheet): void {
  const win = window.open("", "_blank", "width=1100,height=750");
  if (!win) return;

  const header = sheet.subjects.map((subject) => `<th>${escapeHtml(subject.subjectName)}</th>`).join("");
  const rows = sheet.rows
    .map((row) => {
      const cells = row.scores
        .map(
          (cell) =>
            `<td>${cell ? `${cell.total}${cell.grade ? ` (${escapeHtml(cell.grade.letter)})` : ""}` : "—"}</td>`,
        )
        .join("");
      return `<tr><td>${row.position}</td><td>${escapeHtml(row.name)}<div>${escapeHtml(row.admissionNo)}</div></td>${cells}<td><strong>${row.total}</strong></td><td>${row.average}</td></tr>`;
    })
    .join("");

  win.document.write(`
    <!doctype html><html><head><meta charset="utf-8" /><title>Broadsheet — ${escapeHtml(sheet.classLabel)}</title>
    <style>${STYLES}</style></head>
    <body>
      <div class="print-bar"><button onclick="window.print()">Print / Save as PDF</button></div>
      <h1>${escapeHtml(sheet.classLabel)} — ${escapeHtml(sheet.term.name)}</h1>
      <table>
        <thead><tr><th>Pos.</th><th>Student</th>${header}<th>Total</th><th>Average</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>
  `);
  win.document.close();
  win.focus();
}

/** A CSV a teacher can open directly in Excel — the "Excel" half of FEATURES.md §5.9's "PDF/Excel." */
export function downloadBroadsheetCsv(sheet: Broadsheet): void {
  const header = [
    "Position",
    "Student",
    "Admission No.",
    ...sheet.subjects.map((subject) => subject.subjectName),
    "Total",
    "Average",
  ];
  const lines = [header.map(escapeCsv).join(",")];
  for (const row of sheet.rows) {
    const cells = row.scores.map((cell) => (cell ? String(cell.total) : ""));
    lines.push(
      [String(row.position), row.name, row.admissionNo, ...cells, String(row.total), String(row.average)]
        .map(escapeCsv)
        .join(","),
    );
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sheet.classLabel} ${sheet.term.name} broadsheet.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
