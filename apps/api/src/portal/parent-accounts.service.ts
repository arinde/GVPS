import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AuditService } from "@/audit/audit.service";
import { EmailService } from "@/common/email.service";
import { generateTemporaryPassword } from "@/common/secrets";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * The school's side of portal access: issuing a login for a parent's phone
 * number and resetting its password. The temporary password is returned once,
 * to be printed on a slip, and never again (FEATURES.md §1.2's staff rule).
 * Superadmin only at the controller: a login opens children's records.
 */
@Injectable()
export class ParentAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  /** Whether this number has a login, and how many children it reaches. */
  async status(schoolId: string, phone: string) {
    const [account, children] = await Promise.all([
      this.prisma.parentAccount.findUnique({
        where: { schoolId_phone: { schoolId, phone } },
        select: { mustChangePassword: true, lastLoginAt: true, lockedUntil: true, createdAt: true },
      }),
      this.childCount(schoolId, phone),
    ]);
    return { phone, children, account };
  }

  async issue(actor: AuthenticatedStaff, phone: string) {
    const children = await this.childCount(actor.schoolId, phone);
    if (children === 0) throw new NotFoundException("No parent or guardian on record has this phone number.");

    const existing = await this.prisma.parentAccount.findUnique({
      where: { schoolId_phone: { schoolId: actor.schoolId, phone } },
    });
    if (existing) throw new ConflictException("This number already has a portal login. Reset its password instead.");

    const temporaryPassword = generateTemporaryPassword();
    const account = await this.prisma.parentAccount.create({
      data: { schoolId: actor.schoolId, phone, passwordHash: await argon2.hash(temporaryPassword) },
    });
    await this.record(actor, "parent.access.issued", account.id, phone, children);
    await this.notifyAccountIssued(actor.id, actor.schoolId, phone);
    return { phone, children, temporaryPassword };
  }

  async resetPassword(actor: AuthenticatedStaff, phone: string) {
    const account = await this.prisma.parentAccount.findUnique({
      where: { schoolId_phone: { schoolId: actor.schoolId, phone } },
    });
    if (!account) throw new NotFoundException("This number has no portal login yet.");

    const temporaryPassword = generateTemporaryPassword();
    await this.prisma.$transaction([
      this.prisma.parentAccount.update({
        where: { id: account.id },
        data: {
          passwordHash: await argon2.hash(temporaryPassword),
          mustChangePassword: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      // Whoever held the old password loses their session too.
      this.prisma.parentRefreshToken.updateMany({
        where: { parentAccountId: account.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    const children = await this.childCount(actor.schoolId, phone);
    await this.record(actor, "parent.password.reset", account.id, phone, children);
    return { phone, children, temporaryPassword };
  }

  private childCount(schoolId: string, phone: string) {
    return this.prisma.student.count({ where: { schoolId, guardians: { some: { guardian: { phone } } } } });
  }

  /**
   * Confirmation only — never the password itself. The temporary password is
   * shown once on screen and printed on a slip (FEATURES.md §1.2's staff
   * rule applied here too); email is not a secure enough channel to carry it.
   * Silently does nothing if no guardian with this phone has an email on
   * file, or if the send itself fails — EmailService never throws.
   */
  private async notifyAccountIssued(actorStaffId: string, schoolId: string, phone: string): Promise<void> {
    const [guardian, school] = await Promise.all([
      this.prisma.guardian.findFirst({ where: { schoolId, phone, email: { not: null } } }),
      this.prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } }),
    ]);
    if (!guardian?.email) return;

    const schoolName = school?.name ?? "your child's school";
    await this.email.send({
      schoolId,
      actorStaffId,
      entityType: "ParentAccount",
      entityId: phone,
      to: guardian.email,
      subject: `Family portal access created — ${schoolName}`,
      html: `
        <p>Hello ${guardian.firstName},</p>
        <p>A family portal account has been created for your phone number at ${schoolName}.
           You can use it to see your ward's class, attendance and results once published.</p>
        <p>Please visit the school office to collect your login details — they are not sent by email.</p>
      `,
    });
  }

  private record(actor: AuthenticatedStaff, action: string, accountId: string, phone: string, children: number) {
    return this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action,
      entityType: "ParentAccount",
      entityId: accountId,
      after: { phone, children },
    });
  }
}
