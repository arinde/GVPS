import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import type { UpdateStaffDto } from "@/auth/schemas/create-staff.schema";
import { AuditService } from "@/audit/audit.service";
import { auditDiff } from "@/common/audit-diff";
import { maskAccountNumber } from "@/common/mask-account-number";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

const lockoutError = (message: string) => new BadRequestException([{ path: ["roles"], message }]);

/**
 * The superadmin correcting a staff record: details, next of kin, salary
 * account and roles, in one save. Every save that changes something writes
 * one audit row holding only the changed fields, with the account number
 * masked (PLAN.md §4.10). A save with no changes writes nothing.
 */
@Injectable()
export class StaffUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async updateStaff(actor: AuthenticatedStaff, staffId: string, dto: UpdateStaffDto) {
    const { schoolId } = actor;
    const existing = await this.prisma.staff.findFirst({ where: { id: staffId, schoolId }, include: { roles: true } });
    if (!existing) throw new NotFoundException("Staff member not found.");

    if (dto.email !== existing.email) {
      const clash = await this.prisma.staff.findUnique({ where: { schoolId_email: { schoolId, email: dto.email } } });
      if (clash) throw new ConflictException([{ path: ["email"], message: "Another staff account uses this email" }]);
    }

    const oldRoles = existing.roles.map(({ role }) => role);
    await this.assertKeepsASuperadmin(actor, staffId, oldRoles, dto.roles);

    const details = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      otherNames: dto.otherNames ?? null,
      phone: dto.phone,
      address: dto.address,
      nextOfKinName: dto.nextOfKinName,
      nextOfKinRelationship: dto.nextOfKinRelationship,
      nextOfKinPhone: dto.nextOfKinPhone,
      bankName: dto.bankName ?? null,
      accountNumber: dto.accountNumber ?? null,
      accountName: dto.accountName ?? null,
    };

    const diff = auditDiff(
      { ...existing, roles: oldRoles },
      { ...details, roles: dto.roles },
      { accountNumber: (value) => maskAccountNumber(value as string | null) },
    );
    if (!diff) return { changed: false };

    await this.prisma.$transaction([
      this.prisma.staff.update({ where: { id: staffId }, data: details }),
      this.prisma.staffRole.deleteMany({ where: { staffId, role: { notIn: dto.roles } } }),
      ...dto.roles
        .filter((role) => !oldRoles.includes(role))
        .map((role) => this.prisma.staffRole.create({ data: { staffId, role } })),
    ]);

    await this.audit.record({
      schoolId,
      actorStaffId: actor.id,
      action: "staff.updated",
      entityType: "Staff",
      entityId: staffId,
      before: diff.before,
      after: { ...diff.after, name: `${dto.lastName}, ${dto.firstName}` },
    });

    return { changed: true };
  }

  /**
   * A superadmin cannot remove their own superadmin role, and the school
   * cannot be left without one — either would lock everyone out of staff
   * administration, with only the command-line reset as a way back.
   */
  private async assertKeepsASuperadmin(actor: AuthenticatedStaff, staffId: string, before: Role[], after: Role[]) {
    const losing = before.includes(Role.SUPERADMIN) && !after.includes(Role.SUPERADMIN);
    if (!losing) return;
    if (staffId === actor.id) throw lockoutError("You cannot remove your own superadmin role");

    const others = await this.prisma.staffRole.count({
      where: { role: Role.SUPERADMIN, staffId: { not: staffId }, staff: { schoolId: actor.schoolId } },
    });
    if (others === 0) throw lockoutError("The school must keep at least one superadmin");
  }
}
