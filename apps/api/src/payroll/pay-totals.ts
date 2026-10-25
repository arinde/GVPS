import { z } from "zod";
import type { Role } from "@prisma/client";

export type PayLine = { name: string; amountKobo: number };
export type PayLines = { basicKobo: number; allowances: PayLine[]; deductions: PayLine[] };
export type PayTotals = { grossKobo: number; deductionsKobo: number; netKobo: number };

/** Gross is basic plus allowances; net is gross less deductions. Integer kobo throughout (PLAN.md §4.4). */
export function payTotals(lines: PayLines): PayTotals {
  const sum = (items: PayLine[]) => items.reduce((total, item) => total + item.amountKobo, 0);
  const grossKobo = lines.basicKobo + sum(lines.allowances);
  const deductionsKobo = sum(lines.deductions);
  return { grossKobo, deductionsKobo, netKobo: grossKobo - deductionsKobo };
}

/** Who a payslip was for, as at generation — the account number masked (see Payslip in schema.prisma). */
export type PayslipStaff = {
  name: string;
  email: string;
  roles: Role[];
  bankName: string | null;
  accountNumberMasked: string | null;
  accountName: string | null;
};

// Json columns come back as `unknown`-ish JsonValue; narrow them through the
// same shape they were written with rather than casting.
const StoredLinesSchema = z.array(z.object({ name: z.string(), amountKobo: z.number().int() }));

export function readLines(value: unknown): PayLine[] {
  const parsed = StoredLinesSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** "October 2026" — for messages and audit entries. */
export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
