import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PayrollRunStatus, Role } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { monthLabel, payTotals } from "@/payroll/pay-totals";
import type { SavePayLinesDto } from "@/payroll/schemas/payroll.schemas";
import { PrismaService } from "@/prisma/prisma.service";

/** FEATURES.md §14 "Staff / payroll" row: these roles read every payslip. */
export const PAYROLL_READERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.BURSAR, Role.ADMIN_SECRETARY];

/**
 * One payslip at a time: the printable copy, a one-off adjustment to a draft
 * (a bonus, an advance repaid), and a staff member's own finalised payslips.
 */
@Injectable()
export class PayslipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Everyone sees their own payslips once finalised — never a draft, which may still change. */
  async mine(actor: AuthenticatedStaff) {
    const payslips = await this.prisma.payslip.findMany({
      where: { schoolId: actor.schoolId, staffId: actor.id, run: { status: PayrollRunStatus.FINALISED } },
      select: {
        id: true,
        grossKobo: true,
        deductionsKobo: true,
        netKobo: true,
        run: { select: { year: true, month: true } },
      },
    });
    return payslips
      .sort((a, b) => b.run.year - a.run.year || b.run.month - a.run.month)
      .map((slip) => ({ ...slip, label: monthLabel(slip.run.year, slip.run.month) }));
  }

  /** The payslip with what its printout needs: the school's letterhead and the month. */
  async printable(actor: AuthenticatedStaff, payslipId: string) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id: payslipId, schoolId: actor.schoolId },
      include: { run: true },
    });
    const isReader = actor.roles.some((role) => PAYROLL_READERS.includes(role));
    const isOwnFinalised = payslip?.staffId === actor.id && payslip.run.status === PayrollRunStatus.FINALISED;
    // Not found and not yours read the same, so an id cannot be probed.
    if (!payslip || !(isReader || isOwnFinalised)) throw new NotFoundException("This payslip could not be found.");

    const school = await this.prisma.school.findUniqueOrThrow({
      where: { id: actor.schoolId },
      select: { name: true, address: true, phone: true, email: true },
    });
    const { run, ...slip } = payslip;
    return {
      ...slip,
      school,
      label: monthLabel(run.year, run.month),
      status: run.status,
      finalisedAt: run.finalisedAt,
    };
  }

  async update(actor: AuthenticatedStaff, payslipId: string, dto: SavePayLinesDto) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id: payslipId, schoolId: actor.schoolId },
      include: { run: { select: { status: true } } },
    });
    if (!payslip) throw new NotFoundException("This payslip could not be found.");
    if (payslip.run.status !== PayrollRunStatus.DRAFT) {
      throw new ConflictException("This payroll has been finalised and can no longer be changed.");
    }

    const data = { basicKobo: dto.basicKobo, allowances: dto.allowances, deductions: dto.deductions };
    const updated = await this.prisma.payslip.update({
      where: { id: payslipId },
      data: { ...data, ...payTotals(dto) },
    });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "payslip.adjusted",
      entityType: "Payslip",
      entityId: payslipId,
      before: { basicKobo: payslip.basicKobo, allowances: payslip.allowances, deductions: payslip.deductions },
      after: data,
    });
    return updated;
  }
}
