import * as argon2 from "argon2";
import { PrismaClient, Role } from "@prisma/client";

// FEATURES.md §1.6: registration is closed, there is no signup endpoint for
// any role. On a fresh database this is the only way to create the first
// superadmin — every other staff account is created by an existing one
// through /auth/staff. Safe to re-run: no-ops once a school exists.
async function main() {
  const prisma = new PrismaClient();

  const existingSchool = await prisma.school.findFirst();
  if (existingSchool) {
    console.log("Seed skipped: a school already exists.");
    return;
  }

  const schoolName = requireEnv("INITIAL_SCHOOL_NAME");
  const superadminEmail = requireEnv("INITIAL_SUPERADMIN_EMAIL");
  const superadminPassword = requireEnv("INITIAL_SUPERADMIN_PASSWORD");

  const school = await prisma.school.create({ data: { name: schoolName } });
  const passwordHash = await argon2.hash(superadminPassword);

  await prisma.staff.create({
    data: {
      schoolId: school.id,
      email: superadminEmail,
      passwordHash,
      roles: { create: [{ role: Role.SUPERADMIN }] },
    },
  });

  console.log(`Seeded "${schoolName}" with superadmin ${superadminEmail}.`);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
