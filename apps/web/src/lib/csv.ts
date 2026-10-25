function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Saves rows as a CSV that opens directly in Excel. The first row is the header. */
export function downloadCsv(rows: string[][], filename: string): void {
  const text = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
