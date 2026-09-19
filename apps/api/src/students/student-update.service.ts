import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "@/audit/audit.service";
import { auditDiff } from "@/common/audit-diff";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { UpdateGuardianDto, UpdateStudentDto } from "@/students/schemas/update-student.schema";

const fieldError = (path: string, message: string) => new BadRequestException([{ path: [path], message }]);

/**
 * The superadmin correcting student and guardian records. Each save that
 * changes something writes one audit row with only the changed fields, before
 * and after (PLAN.md §4.10); a save with no changes writes nothing.
 */
@Injectable()
export class StudentUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async updateStudent(actor: AuthenticatedStaff, studentId: string, dto: UpdateStudentDto) {
    const existing = await this.prisma.student.findFirst({ where: { id: studentId, schoolId: actor.schoolId } });
    if (!existing) throw new NotFoundException("Student not found.");

    // The year is fixed by the admission number, so a date must agree with it.
    if (dto.dateOfAdmission && Number(dto.dateOfAdmission.slice(0, 4)) !== existing.admissionYear) {
      throw fieldError("dateOfAdmission", `The date must fall in ${existing.admissionYear}, the year of admission`);
    }
    const admittedBy = dto.dateOfAdmission ?? `${existing.admissionYear}-12-31`;
    if (new Date(dto.dateOfBirth) >= new Date(admittedBy)) {
      throw fieldError("dateOfBirth", "A student cannot be admitted before they were born");
    }

    const details = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      otherNames: dto.otherNames ?? null,
      dateOfBirth: new Date(dto.dateOfBirth),
      sex: dto.sex,
      stateOfOrigin: dto.stateOfOrigin ?? null,
      lga: dto.lga ?? null,
      dateOfAdmission: dto.dateOfAdmission ? new Date(dto.dateOfAdmission) : null,
      address: dto.address ?? null,
      bloodGroup: dto.bloodGroup ?? null,
      medicalNote: dto.medicalNote ?? null,
      previousSchool: dto.previousSchool ?? null,
    };

    const diff = auditDiff(existing, details);
    if (!diff) return { changed: false };

    await this.prisma.student.update({ where: { id: studentId }, data: details });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "student.updated",
      entityType: "Student",
      entityId: studentId,
      before: diff.before,
      after: { ...diff.after, admissionNo: existing.admissionNo },
    });
    return { changed: true };
  }

  /** A guardian is shared between siblings, so one correction reaches every child they are linked to. */
  async updateGuardian(actor: AuthenticatedStaff, guardianId: string, dto: UpdateGuardianDto) {
    const existing = await this.prisma.guardian.findFirst({ where: { id: guardianId, schoolId: actor.schoolId } });
    if (!existing) throw new NotFoundException("Parent or guardian not found.");

    const details = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      altPhone: dto.altPhone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      occupation: dto.occupation ?? null,
    };

    const diff = auditDiff(existing, details);
    if (!diff) return { changed: false };

    await this.prisma.guardian.update({ where: { id: guardianId }, data: details });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "guardian.updated",
      entityType: "Guardian",
      entityId: guardianId,
      before: diff.before,
      after: { ...diff.after, name: `${dto.lastName}, ${dto.firstName}` },
    });
    return { changed: true };
  }
}
