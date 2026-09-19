import { Injectable } from "@nestjs/common";
import { Section, type Prisma, type School } from "@prisma/client";

/**
 * Admission numbers (FEATURES.md §3.2).
 *
 * The format lives on the School row so the school can set it once and never
 * have it change underneath them — it is baked into every student from the
 * first record, which is why PLAN.md §8 makes agreeing it a prerequisite to
 * data entry.
 *
 * Uniqueness under concurrent creation is a TESTS.md §7 requirement. The
 * counter is incremented inside the caller's transaction, so two secretaries
 * pressing save at the same instant serialise on that row rather than both
 * reading the same "last" value. The unique index on
 * (schoolId, admissionNo) is the backstop.
 */
@Injectable()
export class AdmissionNumberService {
  /**
   * Must be called inside a transaction — `tx`, not the base client — or the
   * increment is not serialised with the student insert that follows it.
   */
  async allocate(tx: Prisma.TransactionClient, school: School, section: Section, year: number): Promise<string> {
    const code = admissionCodeFor(school, section);

    // One running count per code per year: GVPS/PRY/2026/0001 and
    // GVPS/SEC/2026/0001 are both the first of their kind.
    const counter = await tx.admissionCounter.upsert({
      where: { schoolId_code_year: { schoolId: school.id, code, year } },
      create: { schoolId: school.id, code, year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });

    return formatAdmissionNumber(school, year, counter.lastNumber, code);
  }
}

type CodedSchool = Pick<School, "admissionCodeNursery" | "admissionCodePrimary" | "admissionCodeSecondary">;

/**
 * The category code for the section a child is admitted into. Junior and
 * senior secondary share one code: it is one secondary school.
 */
export function admissionCodeFor(school: CodedSchool, section: Section): string {
  if (section === Section.NURSERY) return school.admissionCodeNursery;
  if (section === Section.PRIMARY) return school.admissionCodePrimary;
  return school.admissionCodeSecondary;
}

/** Exported for tests and for previewing a format before it is committed to. */
export function formatAdmissionNumber(
  school: Pick<School, "admissionNoFormat" | "admissionNoPrefix" | "admissionNoPadding">,
  year: number,
  sequence: number,
  code = "",
): string {
  return school.admissionNoFormat
    .replaceAll("{PREFIX}", school.admissionNoPrefix)
    .replaceAll("{CODE}", code)
    .replaceAll("{YEAR}", String(year))
    .replaceAll("{SEQ}", String(sequence).padStart(school.admissionNoPadding, "0"));
}
