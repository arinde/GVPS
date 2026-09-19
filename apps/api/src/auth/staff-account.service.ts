import { randomBytes } from "node:crypto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import type { Role } from "@prisma/client";
import type { CreateStaffDto } from "@/auth/schemas/create-staff.schema";
import { maskAccountNumber } from "@/common/mask-account-number";
import { AuditService } from "@/audit/audit.service";
import { PrismaService } from "@/prisma/prisma.service";

export type StaffAccountCreated = {
  staffId: string;
  temporaryPassword: string;
};

// PLAN.md §4.12: staff accounts and role changes are superadmin-only,
// separate from student/guardian record creation (admin/secretary work).
// Every mutation here writes to audit — these are privilege decisions, and
// FEATURES.md §1.4 requires being able to answer "who changed this?".
@Injectable()
export class StaffAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createStaff(actorStaffId: string, schoolId: string, dto: CreateStaffDto): Promise<StaffAccountCreated> {
    const { email, roles } = dto;
    const existing = await this.prisma.staff.findUnique({ where: { schoolId_email: { schoolId, email } } });
    if (existing) throw new ConflictException("A staff account with this email already exists.");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await argon2.hash(temporaryPassword);

    const staff = await this.prisma.staff.create({
      data: {
        schoolId,
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        otherNames: dto.otherNames,
        phone: dto.phone,
        address: dto.address,
        nextOfKinName: dto.nextOfKinName,
        nextOfKinRelationship: dto.nextOfKinRelationship,
        nextOfKinPhone: dto.nextOfKinPhone,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        roles: { create: roles.map((role) => ({ role })) },
      },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "staff.create",
      entityType: "Staff",
      entityId: staff.id,
      // The salary account is recorded masked: the log shows an account was
      // set and which one, without holding the full number itself.
      after: {
        email,
        roles,
        name: `${dto.lastName}, ${dto.firstName}`,
        bankName: dto.bankName ?? null,
        accountNumber: maskAccountNumber(dto.accountNumber),
      },
    });

    return { staffId: staff.id, temporaryPassword };
  }

  /**
   * Every staff member in the school, with roles and this session's class
   * allocations — what the staff list and the allocation screen both need.
   * Never returns password hashes or lockout internals.
   */
  async listStaff(schoolId: string) {
    const session = await this.prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true },
    });

    return this.prisma.staff.findMany({
      where: { schoolId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        phone: true,
        mustChangePassword: true,
        createdAt: true,
        roles: { select: { role: true } },
        classAssignments: {
          // No current session means no current allocations to show.
          where: { sessionId: session?.id ?? "__no_current_session__" },
          select: { id: true, classArm: { select: { id: true, name: true, classLevel: { select: { name: true } } } } },
        },
      },
    });
  }

  /**
   * One staff member's full record, salary account included. Superadmin-only
   * at the controller; the list above deliberately leaves the account out.
   */
  async getProfile(schoolId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, schoolId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        phone: true,
        address: true,
        nextOfKinName: true,
        nextOfKinRelationship: true,
        nextOfKinPhone: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        mustChangePassword: true,
        createdAt: true,
        roles: { select: { role: true } },
      },
    });
    if (!staff) throw new NotFoundException("Staff member not found.");
    return staff;
  }

  async grantRole(actorStaffId: string, schoolId: string, staffId: string, role: Role): Promise<void> {
    await this.assertStaffInSchool(schoolId, staffId);

    await this.prisma.staffRole.upsert({
      where: { staffId_role: { staffId, role } },
      create: { staffId, role },
      update: {},
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "staff.role.grant",
      entityType: "Staff",
      entityId: staffId,
      after: { role },
    });
  }

  async revokeRole(actorStaffId: string, schoolId: string, staffId: string, role: Role): Promise<void> {
    await this.assertStaffInSchool(schoolId, staffId);

    await this.prisma.staffRole.deleteMany({ where: { staffId, role } });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "staff.role.revoke",
      entityType: "Staff",
      entityId: staffId,
      before: { role },
    });
  }

  // FEATURES.md §1.2: admin-issued reset, no email round-trip — staff are
  // physically present. Forces a fresh mandatory change, and (like a
  // self-service password change) revokes every existing session.
  async resetPassword(actorStaffId: string, schoolId: string, staffId: string): Promise<StaffAccountCreated> {
    await this.assertStaffInSchool(schoolId, staffId);

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await argon2.hash(temporaryPassword);

    await this.prisma.staff.update({
      where: { id: staffId },
      data: { passwordHash, mustChangePassword: true },
    });
    await this.prisma.refreshToken.updateMany({
      where: { staffId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "staff.password.reset",
      entityType: "Staff",
      entityId: staffId,
    });

    return { staffId, temporaryPassword };
  }

  private async assertStaffInSchool(schoolId: string, staffId: string): Promise<void> {
    const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff || staff.schoolId !== schoolId) throw new NotFoundException("Staff account not found.");
  }
}

function generateTemporaryPassword(): string {
  return randomBytes(12).toString("base64url");
}
