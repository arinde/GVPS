import type { Prisma } from "@prisma/client";
import { maskAccountNumber } from "@/common/mask-account-number";
import { payTotals, readLines, type PayslipStaff } from "@/payroll/pay-totals";
import type { PrismaService } from "@/prisma/prisma.service";

type Db = PrismaService | Prisma.TransactionClient;

const STAFF_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  bankName: true,
  accountNumber: true,
  accountName: true,
  roles: { select: { role: true } },
} as const;

type StaffRow = Prisma.StaffGetPayload<{ select: typeof STAFF_SELECT }>;

function snapshotStaff(staff: StaffRow): PayslipStaff {
  return {
    name: staff.lastName && staff.firstName ? `${staff.lastName}, ${staff.firstName}` : staff.email,
    email: staff.email,
    roles: staff.roles.map(({ role }) => role),
    bankName: staff.bankName,
    accountNumberMasked: maskAccountNumber(staff.accountNumber),
    accountName: staff.accountName,
  };
}

/**
 * One payslip row per current staff member who has a salary set, copied from
 * their salary structure as it stands now. Staff without a salary are left
 * out rather than paid zero — the run screen lists who was skipped.
 */
export async function payslipsFromSalaries(
  db: Db,
  schoolId: string,
  runId: string,
): Promise<Prisma.PayslipCreateManyInput[]> {
  const salaries = await db.staffSalary.findMany({ where: { schoolId } });
  const staff = await db.staff.findMany({
    where: { schoolId, deletedAt: null, id: { in: salaries.map((salary) => salary.staffId) } },
    select: STAFF_SELECT,
  });
  const staffById = new Map(staff.map((member) => [member.id, member]));

  return salaries.flatMap((salary) => {
    const member = staffById.get(salary.staffId);
    if (!member) return [];
    const lines = {
      basicKobo: salary.basicKobo,
      allowances: readLines(salary.allowances),
      deductions: readLines(salary.deductions),
    };
    return [{ schoolId, runId, staffId: member.id, ...lines, ...payTotals(lines), staff: snapshotStaff(member) }];
  });
}

/** The staff details as they stand now, keyed by id — taken again at finalise so a payslip shows the current account. */
export async function currentStaffSnapshots(db: Db, schoolId: string, staffIds: string[]) {
  const staff = await db.staff.findMany({ where: { schoolId, id: { in: staffIds } }, select: STAFF_SELECT });
  return new Map(staff.map((member) => [member.id, snapshotStaff(member)]));
}
