import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { payTotals, readLines } from "@/payroll/pay-totals";
import type { SavePayLinesDto } from "@/payroll/schemas/payroll.schemas";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * FEATURES.md §9.4 — each staff member's salary structure: basic pay, the
 * allowances on top, and the deductions taken off. This is the template a
 * payroll run copies from; changing it never touches a run already made.
 */
@Injectable()
export class SalariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Every current staff member, with their salary or null if none is set yet. */
  async list(schoolId: string) {
    const [staff, salaries] = await Promise.all([
      this.prisma.staff.findMany({
        where: { schoolId, deletedAt: null },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { email: "asc" }],
        select: { id: true, email: true, firstName: true, lastName: true, roles: { select: { role: true } } },
      }),
      this.prisma.staffSalary.findMany({ where: { schoolId } }),
    ]);
    const byStaff = new Map(salaries.map((salary) => [salary.staffId, salary]));

    return staff.map((member) => {
      const salary = byStaff.get(member.id);
      if (!salary) return { staff: member, salary: null };
      const lines = {
        basicKobo: salary.basicKobo,
        allowances: readLines(salary.allowances),
        deductions: readLines(salary.deductions),
      };
      return { staff: member, salary: { ...lines, ...payTotals(lines), updatedAt: salary.updatedAt } };
    });
  }

  async save(actor: AuthenticatedStaff, staffId: string, dto: SavePayLinesDto) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, schoolId: actor.schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!staff) throw new NotFoundException("This staff member could not be found.");

    const before = await this.prisma.staffSalary.findUnique({ where: { staffId } });
    const data = { basicKobo: dto.basicKobo, allowances: dto.allowances, deductions: dto.deductions };
    const saved = await this.prisma.staffSalary.upsert({
      where: { staffId },
      create: { schoolId: actor.schoolId, staffId, updatedById: actor.id, ...data },
      update: { updatedById: actor.id, ...data },
    });

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: before ? "salary.updated" : "salary.created",
      entityType: "StaffSalary",
      entityId: saved.id,
      before: before
        ? { staffId, basicKobo: before.basicKobo, allowances: before.allowances, deductions: before.deductions }
        : undefined,
      after: { staffId, ...data },
    });
    return saved;
  }
}
