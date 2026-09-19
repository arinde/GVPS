import { BadRequestException } from "@nestjs/common";
import { Section, type ClassArm, type ClassLevel, type Stream } from "@prisma/client";
import type { GuardianInputDto } from "@/students/schemas/create-student.schema";

// Pure registration rules, kept apart from StudentsService's database work so
// they are tested directly and read in one place.

/**
 * The department to record on the enrolment (see Enrolment.stream).
 *
 * Senior arms need one; everything else must not have one. If the arm itself
 * is tagged with a stream, that decides it, and a conflicting choice is an
 * error rather than silently overridden. Errors use the validation pipe's
 * { path, message } shape so the form highlights the department field.
 */
export function resolveStream(arm: ClassArm & { classLevel: ClassLevel }, requested?: Stream): Stream | null {
  const fieldError = (message: string) => new BadRequestException([{ path: ["stream"], message }]);

  if (arm.classLevel.section !== Section.SENIOR) {
    if (requested) throw fieldError(`${arm.classLevel.name} students do not have a department`);
    return null;
  }
  if (arm.stream) {
    if (requested && requested !== arm.stream) {
      throw fieldError(`${arm.classLevel.name}${arm.name} is a ${arm.stream.toLowerCase()} class`);
    }
    return arm.stream;
  }
  if (!requested) throw fieldError("Choose a department for a senior student");
  return requested;
}

/**
 * Exactly one guardian is the primary contact. If none was marked, the first
 * one is — the office always needs someone to ring first (FEATURES.md §3.3).
 */
export function withOnePrimary(guardians: GuardianInputDto[]): GuardianInputDto[] {
  if (guardians.some((guardian) => guardian.isPrimary)) return guardians;
  return guardians.map((guardian, index) => ({ ...guardian, isPrimary: index === 0 }));
}
