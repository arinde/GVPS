import "dotenv/config";
import { randomBytes } from "node:crypto";
import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

/**
 * Command-line password reset. The only way back into a fresh or locked-out
 * system.
 *
 * FEATURES.md §1.2 puts staff password resets in an admin's hands rather than
 * an email round-trip, and §1.6 closes registration entirely — which leaves
 * the bootstrap superadmin with no recovery path at all through the API,
 * since /auth/staff/:id/reset-password itself requires a superadmin session.
 * This closes that circle. It needs database credentials to run, so it is as
 * privileged as the database itself, and it writes to the audit log.
 *
 *   npm run db:reset-password -w apps/api -- someone@school.example
 */
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:reset-password -w apps/api -- <email>");
    process.exit(1);
  }

  const staff = await prisma.staff.findFirst({ where: { email }, include: { roles: true } });
  if (!staff) {
    const known = await prisma.staff.findMany({ select: { email: true } });
    console.error(`No staff account for "${email}".`);
    console.error(`Known accounts: ${known.map((s) => s.email).join(", ") || "(none)"}`);
    process.exit(1);
  }

  // URL-safe, no ambiguous characters to misread off a screen.
  const password = randomBytes(9).toString("base64url");
  const passwordHash = await argon2.hash(password);

  await prisma.$transaction(async (tx) => {
    await tx.staff.update({
      where: { id: staff.id },
      data: {
        passwordHash,
        // Forced change on next login (FEATURES.md §1.2), so this temporary
        // password is never the standing one.
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Any session opened with the old password stops working immediately.
    await tx.refreshToken.updateMany({
      where: { staffId: staff.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        schoolId: staff.schoolId,
        actorStaffId: null, // Run from a shell; there is no signed-in actor.
        action: "staff.password_reset_cli",
        entityType: "Staff",
        entityId: staff.id,
        reason: "Password reset from the command line",
      },
    });
  });

  console.log(`\n  Account:   ${staff.email}`);
  console.log(`  Roles:     ${staff.roles.map((r) => r.role).join(", ")}`);
  console.log(`  Password:  ${password}`);
  console.log(`\n  Shown once. You will be asked to change it at login.`);
  console.log(`  Existing sessions on this account have been revoked.\n`);

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error("ERR:", error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
