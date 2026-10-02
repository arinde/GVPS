import { ForbiddenException, Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AccessScopeService } from "@/access/access-scope.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { computeInvoiceBalance } from "@/fees/invoice-balance";
import { PrismaService } from "@/prisma/prisma.service";

export type Debtor = {
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string | null;
  balanceKobo: number;
};

// FEATURES.md §14 "Debtor reports" row: superadmin, principal and bursar see
// the whole school; a form teacher sees only their own arm. Subject teacher
// and admin/secretary have no access at all.
const WHOLE_SCHOOL_READERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.BURSAR];

/** Every student whose most recent invoice still has a balance — FEATURES.md §6.5's "single report that justifies the system". */
@Injectable()
export class DebtorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessScopeService,
  ) {}

  async list(actor: AuthenticatedStaff): Promise<Debtor[]> {
    let armIds: string[] | null = null;
    if (!actor.roles.some((role) => WHOLE_SCHOOL_READERS.includes(role))) {
      if (!actor.roles.includes(Role.FORM_TEACHER)) {
        throw new ForbiddenException("You do not have access to debtor reports.");
      }
      armIds = (await this.access.allocatedArms(actor)).armIds;
      if (armIds.length === 0) return [];
    }

    // One row per student: their single most recently generated invoice,
    // whose own balance already carries every prior term's arrears forward.
    const invoices = await this.prisma.invoice.findMany({
      where: { schoolId: actor.schoolId },
      include: { lineItems: true, payments: true },
      orderBy: { createdAt: "desc" },
      distinct: ["studentId"],
    });

    const withBalance = invoices
      .map((invoice) => ({ invoice, balanceKobo: computeInvoiceBalance(invoice).balance }))
      .filter((row) => row.balanceKobo > 0);
    if (withBalance.length === 0) return [];

    // Invoice has no formal relation to Student (the lean, cross-table-scalar
    // convention used throughout this schema) — fetched here as a separate,
    // batched lookup rather than a per-invoice query.
    const students = await this.prisma.student.findMany({
      where: { id: { in: withBalance.map((row) => row.invoice.studentId) } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        enrolments: {
          where: { status: "ACTIVE" },
          select: { classArmId: true, classArm: { select: { name: true, classLevel: { select: { name: true } } } } },
          take: 1,
        },
      },
    });
    const studentById = new Map(students.map((student) => [student.id, student]));

    return withBalance
      .map((row): Debtor | null => {
        const student = studentById.get(row.invoice.studentId);
        if (!student) return null;

        const enrolment = student.enrolments[0];
        if (armIds !== null && (!enrolment || !armIds.includes(enrolment.classArmId))) return null;

        return {
          studentId: student.id,
          studentName: `${student.lastName}, ${student.firstName}`,
          admissionNo: student.admissionNo,
          className: enrolment ? `${enrolment.classArm.classLevel.name}${enrolment.classArm.name}` : null,
          balanceKobo: row.balanceKobo,
        };
      })
      .filter((debtor): debtor is Debtor => debtor !== null)
      .sort((a, b) => b.balanceKobo - a.balanceKobo);
  }
}
