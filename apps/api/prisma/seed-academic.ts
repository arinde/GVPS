import "dotenv/config";
import { PrismaClient, Section } from "@prisma/client";

/**
 * Seeds the academic structure so registration can begin: the twelve class
 * levels, one arm each, and the current session and term.
 *
 * Safe to re-run — every step is keyed on a natural unique constraint, so it
 * fills gaps rather than duplicating. Arms beyond "A", and any renaming, are
 * done through /academic once the school says what they actually run.
 */
const prisma = new PrismaClient();

const LEVELS: { name: string; section: Section; rank: number }[] = [
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ name: `Primary ${n}`, section: Section.PRIMARY, rank: n })),
  ...[1, 2, 3].map((n) => ({ name: `JSS ${n}`, section: Section.JUNIOR, rank: 6 + n })),
  ...[1, 2, 3].map((n) => ({ name: `SSS ${n}`, section: Section.SENIOR, rank: 9 + n })),
];

const SESSION = {
  name: "2026/2027",
  startDate: new Date("2026-09-01"),
  endDate: new Date("2027-07-31"),
};

const TERMS = [
  { sequence: 1, name: "First Term", startDate: new Date("2026-09-14"), endDate: new Date("2026-12-18") },
  { sequence: 2, name: "Second Term", startDate: new Date("2027-01-05"), endDate: new Date("2027-04-02") },
  { sequence: 3, name: "Third Term", startDate: new Date("2027-04-19"), endDate: new Date("2027-07-23") },
];

async function main() {
  const school = await prisma.school.findFirstOrThrow();
  console.log(`School: ${school.name}`);

  for (const level of LEVELS) {
    const record = await prisma.classLevel.upsert({
      where: { schoolId_name: { schoolId: school.id, name: level.name } },
      create: { schoolId: school.id, ...level },
      update: {},
    });

    await prisma.classArm.upsert({
      where: { classLevelId_name: { classLevelId: record.id, name: "A" } },
      create: { schoolId: school.id, classLevelId: record.id, name: "A" },
      update: {},
    });
  }
  console.log(`Levels: ${LEVELS.length}, each with arm A`);

  const session = await prisma.academicSession.upsert({
    where: { schoolId_name: { schoolId: school.id, name: SESSION.name } },
    create: { schoolId: school.id, ...SESSION },
    update: {},
  });

  for (const term of TERMS) {
    await prisma.term.upsert({
      where: { sessionId_sequence: { sessionId: session.id, sequence: term.sequence } },
      create: { schoolId: school.id, sessionId: session.id, ...term },
      update: {},
    });
  }
  console.log(`Session: ${session.name} with ${TERMS.length} terms`);

  // Current flags are swapped inside a transaction because the database has a
  // partial unique index allowing only one current row per school — two
  // separate writes would collide on it rather than swap cleanly.
  const firstTerm = await prisma.term.findFirstOrThrow({ where: { sessionId: session.id, sequence: 1 } });

  await prisma.$transaction(async (tx) => {
    await tx.academicSession.updateMany({
      where: { schoolId: school.id, isCurrent: true },
      data: { isCurrent: false },
    });
    await tx.academicSession.update({ where: { id: session.id }, data: { isCurrent: true } });
    await tx.term.updateMany({ where: { schoolId: school.id, isCurrent: true }, data: { isCurrent: false } });
    await tx.term.update({ where: { id: firstTerm.id }, data: { isCurrent: true } });
  });
  console.log(`Current: ${session.name}, ${firstTerm.name}`);

  const arms = await prisma.classArm.count({ where: { schoolId: school.id } });
  console.log(`\nReady for registration: ${arms} arms available.`);

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error("ERR:", error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
