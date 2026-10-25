import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PayrollRunStatus } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { monthLabel } from "@/payroll/pay-totals";
import { currentStaffSnapshots, payslipsFromSalaries } from "@/payroll/payslip-source";
import type { CreatePayrollRunDto } from "@/payroll/schemas/payroll.schemas";
import { PrismaService } from "@/prisma/prisma.service";

const NO_SALARIES = "No staff member has a salary set yet. Set salaries first, then create the payroll.";

function totalsOf(payslips: { grossKobo: number; deductionsKobo: number; netKobo: number }[]) {
  return payslips.reduce(
    (sum, slip) => ({
      grossKobo: sum.grossKobo + slip.grossKobo,
      deductionsKobo: sum.deductionsKobo + slip.deductionsKobo,
      netKobo: sum.netKobo + slip.netKobo,
    }),
    { grossKobo: 0, deductionsKobo: 0, netKobo: 0 },
  );
}

/**
 * FEATURES.md §9.4 — the monthly payroll run. Created as a draft from the
 * salary structures; while a draft it can be refreshed, adjusted payslip by
 * payslip (PayslipsService) or deleted. Finalising freezes it for good.
 */
@Injectable()
export class PayrollRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(schoolId: string) {
    const runs = await this.prisma.payrollRun.findMany({
      where: { schoolId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { payslips: { select: { grossKobo: true, deductionsKobo: true, netKobo: true } } },
    });
    return runs.map(({ payslips, ...run }) => ({
      ...run,
      label: monthLabel(run.year, run.month),
      staffCount: payslips.length,
      ...totalsOf(payslips),
    }));
  }

  /** The run with every payslip and the letterhead, so the whole month can be printed in one go. */
  async get(schoolId: string, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, schoolId }, include: { payslips: true } });
    if (!run) throw new NotFoundException("This payroll could not be found.");
    const school = await this.prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { name: true, address: true, phone: true, email: true },
    });
    return {
      ...run,
      label: monthLabel(run.year, run.month),
      school,
      staffCount: run.payslips.length,
      ...totalsOf(run.payslips),
    };
  }

  async create(actor: AuthenticatedStaff, dto: CreatePayrollRunDto) {
    const label = monthLabel(dto.year, dto.month);
    const existing = await this.prisma.payrollRun.findUnique({
      where: { schoolId_year_month: { schoolId: actor.schoolId, year: dto.year, month: dto.month } },
    });
    if (existing) throw new ConflictException(`Payroll for ${label} already exists. Open it from the list.`);

    const run = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payrollRun.create({
        data: { schoolId: actor.schoolId, year: dto.year, month: dto.month, createdById: actor.id },
      });
      const payslips = await payslipsFromSalaries(tx, actor.schoolId, created.id);
      if (payslips.length === 0) throw new BadRequestException(NO_SALARIES);
      await tx.payslip.createMany({ data: payslips });
      return created;
    });

    await this.record(actor, "payroll.created", run.id, { period: label });
    return this.get(actor.schoolId, run.id);
  }

  /** Re-copies every payslip from the salary structures. Discards any adjustment made to this draft. */
  async refresh(actor: AuthenticatedStaff, runId: string) {
    const run = await this.findDraftOrThrow(actor.schoolId, runId);
    await this.prisma.$transaction(async (tx) => {
      const payslips = await payslipsFromSalaries(tx, actor.schoolId, run.id);
      if (payslips.length === 0) throw new BadRequestException(NO_SALARIES);
      await tx.payslip.deleteMany({ where: { runId: run.id } });
      await tx.payslip.createMany({ data: payslips });
    });
    await this.record(actor, "payroll.refreshed", run.id, { period: monthLabel(run.year, run.month) });
    return this.get(actor.schoolId, run.id);
  }

  async finalise(actor: AuthenticatedStaff, runId: string) {
    const run = await this.findDraftOrThrow(actor.schoolId, runId);
    const payslips = await this.prisma.payslip.findMany({ where: { runId }, select: { id: true, staffId: true } });
    if (payslips.length === 0) throw new BadRequestException("This payroll has no payslips to finalise.");

    // Bank details may have changed since the draft was made; the frozen
    // payslip should name the account the money actually went to.
    await this.prisma.$transaction(async (tx) => {
      const snapshots = await currentStaffSnapshots(
        tx,
        actor.schoolId,
        payslips.map((slip) => slip.staffId),
      );
      for (const slip of payslips) {
        const staff = snapshots.get(slip.staffId);
        if (staff) await tx.payslip.update({ where: { id: slip.id }, data: { staff } });
      }
      await tx.payrollRun.update({
        where: { id: runId },
        data: { status: PayrollRunStatus.FINALISED, finalisedAt: new Date(), finalisedById: actor.id },
      });
    });

    const finalised = await this.get(actor.schoolId, runId);
    await this.record(actor, "payroll.finalised", runId, {
      period: monthLabel(run.year, run.month),
      staffCount: finalised.staffCount,
      netKobo: finalised.netKobo,
    });
    return finalised;
  }

  /** A draft was never issued, so removing it loses nothing. A finalised run is permanent. */
  async remove(actor: AuthenticatedStaff, runId: string) {
    const run = await this.findDraftOrThrow(actor.schoolId, runId);
    await this.prisma.payrollRun.delete({ where: { id: runId } });
    await this.record(actor, "payroll.deleted", runId, { period: monthLabel(run.year, run.month) });
    return { deleted: true };
  }

  private async findDraftOrThrow(schoolId: string, runId: string) {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, schoolId } });
    if (!run) throw new NotFoundException("This payroll could not be found.");
    if (run.status !== PayrollRunStatus.DRAFT) {
      throw new ConflictException("This payroll has been finalised and can no longer be changed.");
    }
    return run;
  }

  private record(actor: AuthenticatedStaff, action: string, runId: string, after: Record<string, unknown>) {
    return this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action,
      entityType: "PayrollRun",
      entityId: runId,
      after,
    });
  }
}
