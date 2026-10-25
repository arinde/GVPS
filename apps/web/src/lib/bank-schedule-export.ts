import { downloadCsv } from "@/lib/csv";
import type { BankSchedule, BankScheduleRow } from "@/store/api/payroll-api";

/** Plain "85000.00" — what bank bulk-upload templates expect, with no ₦ or commas. */
function amount(kobo: number): string {
  return `${Math.trunc(kobo / 100)}.${String(kobo % 100).padStart(2, "0")}`;
}

function check(row: BankScheduleRow): string {
  if (row.missingAccount) return "No salary account on record";
  if (row.accountChanged) return "Account changed since finalised - confirm with the staff member before paying";
  return "";
}

/** The month's transfers as a CSV for the bank, flagged rows marked in the last column. */
export function downloadBankSchedule(schedule: BankSchedule): void {
  const header = ["Staff member", "Bank", "Account number", "Account name", "Amount (NGN)", "Check"];
  const rows = schedule.rows.map((row) => [
    row.staffName,
    row.bankName ?? "",
    row.accountNumber ?? "",
    row.accountName ?? "",
    amount(row.netKobo),
    check(row),
  ]);
  const total = ["Total", "", "", "", amount(schedule.totalKobo), ""];
  downloadCsv([header, ...rows, total], `Bank payment list ${schedule.label}.csv`);
}
