import { z } from "zod";
import { payTotals } from "@/payroll/pay-totals";

// One allowance or deduction: "Transport", "PAYE", "Pension (8%)". A fixed
// amount, never a rate — see the payroll note in schema.prisma.
const PayLineSchema = z.object({
  name: z.string().trim().min(1, "Give this line a name.").max(60),
  amountKobo: z.int().min(1, "Each amount must be more than zero."),
});

export const PayLinesSchema = z.array(PayLineSchema).max(20);

// A salary structure and a draft payslip have the same shape, so one schema
// serves both: the normal month, and this month's adjusted copy.
export const SavePayLinesSchema = z
  .object({
    basicKobo: z.int().min(0, "Basic salary cannot be negative."),
    allowances: PayLinesSchema,
    deductions: PayLinesSchema,
  })
  .refine((value) => payTotals(value).netKobo >= 0, {
    message: "Deductions cannot add up to more than the gross pay.",
    path: ["deductions"],
  })
  .refine((value) => payTotals(value).grossKobo > 0, {
    message: "Enter a basic salary or at least one allowance.",
    path: ["basicKobo"],
  });
export type SavePayLinesDto = z.infer<typeof SavePayLinesSchema>;

export const CreatePayrollRunSchema = z.object({
  year: z.int().min(2000).max(2100),
  month: z.int().min(1, "Choose a month.").max(12, "Choose a month."),
});
export type CreatePayrollRunDto = z.infer<typeof CreatePayrollRunSchema>;
