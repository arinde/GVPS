import { Injectable } from "@nestjs/common";
import type { Prisma, School } from "@prisma/client";

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
  async allocate(tx: Prisma.TransactionClient, school: School, admittedOn: Date): Promise<string> {
    const year = admittedOn.getFullYear();

    const counter = await tx.admissionCounter.upsert({
      where: { schoolId_year: { schoolId: school.id, year } },
      create: { schoolId: school.id, year, lastNumber: 1 },
      update: { lastNumber: { increment: 1 } },
    });

    return formatAdmissionNumber(school, year, counter.lastNumber);
  }
}

/** Exported for tests and for previewing a format before it is committed to. */
export function formatAdmissionNumber(
  school: Pick<School, "admissionNoFormat" | "admissionNoPrefix" | "admissionNoPadding">,
  year: number,
  sequence: number,
): string {
  return school.admissionNoFormat
    .replaceAll("{PREFIX}", school.admissionNoPrefix)
    .replaceAll("{YEAR}", String(year))
    .replaceAll("{SEQ}", String(sequence).padStart(school.admissionNoPadding, "0"));
}
