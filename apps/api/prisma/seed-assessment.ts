import "dotenv/config";
import { PrismaClient, Section } from "@prisma/client";

/**
 * Seeds Block 1 of the results engine (FEATURES.md §5.1, §5.2): CA 40 / Exam
 * 60 for the current term, and a standard 5-band grading scale, for Primary,
 * Junior and Senior (Nursery has no formal scored assessment). All of this is
 * admin-configurable afterwards through /assessment — these are starting
 * values, not fixed ones.
 *
 * Safe to re-run: components are reset per (term, section) and the grading
 * scale is upserted per section, so running it twice just re-applies the
 * same values rather than duplicating anything.
 */
const prisma = new PrismaClient();

const COMPONENTS = [
  { name: "CA", maxScore: 40 },
  { name: "Exam", maxScore: 60 },
];

const BANDS = [
  { minScore: 70, maxScore: 100, letter: "A", descriptor: "Excellent", remark: "Excellent" },
  { minScore: 60, maxScore: 69, letter: "B", descriptor: "Very Good", remark: "Very good" },
  { minScore: 50, maxScore: 59, letter: "C", descriptor: "Good", remark: "Good" },
  { minScore: 40, maxScore: 49, letter: "D", descriptor: "Pass", remark: "Fair, must improve" },
  { minScore: 0, maxScore: 39, letter: "F", descriptor: "Fail", remark: "Fail" },
];

const SCORED_SECTIONS = [Section.PRIMARY, Section.JUNIOR, Section.SENIOR];

async function main() {
  const school = await prisma.school.findFirstOrThrow();
  const term = await prisma.term.findFirstOrThrow({ where: { schoolId: school.id, isCurrent: true } });
  console.log(`School: ${school.name}, current term: ${term.name}`);

  for (const section of SCORED_SECTIONS) {
    await prisma.$transaction(async (tx) => {
      await tx.assessmentComponent.deleteMany({ where: { termId: term.id, section } });
      await tx.assessmentComponent.createMany({
        data: COMPONENTS.map((component) => ({ schoolId: school.id, termId: term.id, section, ...component })),
      });

      const scale = await tx.gradingScale.upsert({
        where: { schoolId_section: { schoolId: school.id, section } },
        create: { schoolId: school.id, section, passMark: 40, promotionThreshold: 40 },
        update: { passMark: 40, promotionThreshold: 40 },
      });
      await tx.gradeBand.deleteMany({ where: { gradingScaleId: scale.id } });
      await tx.gradeBand.createMany({ data: BANDS.map((band) => ({ gradingScaleId: scale.id, ...band })) });
    });
    console.log(`${section}: CA 40 / Exam 60, grading scale A-F (pass 40, promotion 40)`);
  }

  await prisma.$disconnect();
}

main().catch(async (error: unknown) => {
  console.error("ERR:", error instanceof Error ? error.message : error);
  await prisma.$disconnect();
  process.exit(1);
});
