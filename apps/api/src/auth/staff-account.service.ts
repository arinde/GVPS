import { randomBytes } from "node:crypto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import type { Role } from "@prisma/client";
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

  async createStaff(
    actorStaffId: string,
    schoolId: string,
    email: string,
    roles: Role[],
  ): Promise<StaffAccountCreated> {
    const existing = await this.prisma.staff.findUnique({ where: { schoolId_email: { schoolId, email } } });
    if (existing) throw new ConflictException("A staff account with this email already exists.");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await argon2.hash(temporaryPassword);

    const staff = await this.prisma.staff.create({
      data: {
        schoolId,
        email,
        passwordHash,
        roles: { create: roles.map((role) => ({ role })) },
      },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "staff.create",
      entityType: "Staff",
      entityId: staff.id,
      after: { email, roles },
    });

    return { staffId: staff.id, temporaryPassword };
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
