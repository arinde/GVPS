import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PayrollRunStatus } from "@prisma/client";
import { z } from "zod";
import { AuditService } from "@/audit/audit.service";
import { maskAccountNumber } from "@/common/mask-account-number";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { monthLabel } from "@/payroll/pay-totals";
import { PrismaService } from "@/prisma/prisma.service";

// The parts of Payslip.staff this needs, narrowed rather than cast.
const SnapshotSchema = z.object({
  name: z.string(),
  bankName: z.string().nullable(),
  accountNumberMasked: z.string().nullable(),
});

/**
 * The month's transfers for the bank: who, which account, how much. The one
 * place full account numbers leave the staff record, so it is superadmin only,
 * finalised months only, and every export is audited.
 *
 * Payslips keep only a masked number, so the full one is read from the staff
 * record now. If it no longer matches what the payslip was finalised with,
 * the row is flagged rather than silently paid to a new account — a changed
 * salary account is exactly what a fraudster would try.
 */
@Injectable()
export class BankScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async forRun(actor: AuthenticatedStaff, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: runId, schoolId: actor.schoolId },
      include: { payslips: { select: { staffId: true, netKobo: true, staff: true } } },
    });
    if (!run) throw new NotFoundException("This payroll could not be found.");
    if (run.status !== PayrollRunStatus.FINALISED) {
      throw new ConflictException(
        "Finalise this payroll first. The bank list is only for amounts actually being paid.",
      );
    }

    const staff = await this.prisma.staff.findMany({
      where: { schoolId: actor.schoolId, id: { in: run.payslips.map((slip) => slip.staffId) } },
      select: { id: true, bankName: true, accountNumber: true, accountName: true },
    });
    const staffById = new Map(staff.map((member) => [member.id, member]));

    const rows = run.payslips
      .map((slip) => {
        const snapshot = SnapshotSchema.safeParse(slip.staff);
        const current = staffById.get(slip.staffId);
        const finalised = snapshot.success ? snapshot.data : null;
        const accountChanged =
          !finalised ||
          finalised.bankName !== (current?.bankName ?? null) ||
          finalised.accountNumberMasked !== maskAccountNumber(current?.accountNumber);
        return {
          staffName: finalised?.name ?? "—",
          bankName: current?.bankName ?? null,
          accountNumber: current?.accountNumber ?? null,
          accountName: current?.accountName ?? null,
          netKobo: slip.netKobo,
          missingAccount: !current?.accountNumber,
          accountChanged,
        };
      })
      .sort((a, b) => a.staffName.localeCompare(b.staffName));

    const label = monthLabel(run.year, run.month);
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "payroll.bank-schedule-exported",
      entityType: "PayrollRun",
      entityId: run.id,
      after: { period: label, rows: rows.length, flagged: rows.filter((row) => row.accountChanged).length },
    });

    return { label, totalKobo: rows.reduce((sum, row) => sum + row.netKobo, 0), rows };
  }
}
