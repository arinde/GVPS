import { formatKobo, parseNairaToKobo } from "@/lib/money";
import type { PayLine, PayLines, PayTotals } from "@/store/api/payroll-api";

/** A line as typed: the amount stays text until it is checked, so "12,5" is never silently saved as something else. */
export type LineDraft = { name: string; amount: string };
export type PayDraft = { basic: string; allowances: LineDraft[]; deductions: LineDraft[] };
export type PayDraftErrors = Record<string, string>;

function nairaText(kobo: number): string {
  return formatKobo(kobo).replace("₦", "");
}

export function toDraft(lines: PayLines | null): PayDraft {
  if (!lines) return { basic: "", allowances: [], deductions: [] };
  const toLine = (line: PayLine): LineDraft => ({ name: line.name, amount: nairaText(line.amountKobo) });
  return {
    basic: nairaText(lines.basicKobo),
    allowances: lines.allowances.map(toLine),
    deductions: lines.deductions.map(toLine),
  };
}

function readLines(drafts: LineDraft[], key: "allowances" | "deductions", errors: PayDraftErrors): PayLine[] {
  return drafts.map((draft, index) => {
    const name = draft.name.trim();
    const amountKobo = parseNairaToKobo(draft.amount);
    if (!name) errors[`${key}.${index}.name`] = "Give this line a name.";
    if (amountKobo === null || amountKobo <= 0) errors[`${key}.${index}.amountKobo`] = "Enter an amount above zero.";
    return { name, amountKobo: amountKobo ?? 0 };
  });
}

function sum(lines: PayLine[]): number {
  return lines.reduce((total, line) => total + line.amountKobo, 0);
}

/** Same arithmetic as the API: gross is basic plus allowances, net is gross less deductions. */
export function totalsOf(lines: PayLines): PayTotals {
  const grossKobo = lines.basicKobo + sum(lines.allowances);
  const deductionsKobo = sum(lines.deductions);
  return { grossKobo, deductionsKobo, netKobo: grossKobo - deductionsKobo };
}

/**
 * Checks what the client can know before the round trip (AGENTS.md §12).
 * Error keys match the API's zod paths, so server errors land on the same fields.
 */
export function readDraft(draft: PayDraft): { lines: PayLines; errors: PayDraftErrors } {
  const errors: PayDraftErrors = {};
  const basicKobo = draft.basic.trim() === "" ? 0 : parseNairaToKobo(draft.basic);
  if (basicKobo === null || basicKobo < 0) errors.basicKobo = "Enter the basic salary in naira, e.g. 85,000.";

  const lines: PayLines = {
    basicKobo: basicKobo ?? 0,
    allowances: readLines(draft.allowances, "allowances", errors),
    deductions: readLines(draft.deductions, "deductions", errors),
  };
  const totals = totalsOf(lines);
  if (!errors.basicKobo && totals.grossKobo <= 0) errors.basicKobo = "Enter a basic salary or at least one allowance.";
  if (totals.netKobo < 0) errors.deductions = "Deductions cannot add up to more than the gross pay.";
  return { lines, errors };
}

/** Drops the errors for one field and anything under it, so editing a line clears only that line's message. */
export function clearError(errors: PayDraftErrors, key: string): PayDraftErrors {
  const next: PayDraftErrors = {};
  for (const [field, message] of Object.entries(errors)) {
    if (field !== key && !field.startsWith(`${key}.`)) next[field] = message;
  }
  return next;
}
