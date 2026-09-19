import { Injectable, NotFoundException } from "@nestjs/common";
import { AccessScopeService } from "@/access/access-scope.service";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { StudentPhotoDto } from "@/students/schemas/student-photo.schema";

/**
 * Passport photographs. Scoped exactly like the student record: a teacher can
 * see or set a photo only for a student in their own classes, and anyone else
 * gets "not found", as for the record itself.
 */
@Injectable()
export class StudentPhotoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessScopeService,
    private readonly audit: AuditService,
  ) {}

  async get(actor: AuthenticatedStaff, studentId: string) {
    await this.findStudentOrThrow(actor, studentId);
    const photo = await this.prisma.studentPhoto.findUnique({ where: { studentId } });
    if (!photo) throw new NotFoundException("This student has no photograph yet.");
    return {
      dataUrl: `data:${photo.mimeType};base64,${Buffer.from(photo.data).toString("base64")}`,
      updatedAt: photo.updatedAt,
    };
  }

  async set(actor: AuthenticatedStaff, studentId: string, dto: StudentPhotoDto) {
    const student = await this.findStudentOrThrow(actor, studentId);
    const data = Buffer.from(dto.base64, "base64");

    const photo = await this.prisma.studentPhoto.upsert({
      where: { studentId },
      create: { schoolId: actor.schoolId, studentId, mimeType: dto.mimeType, data },
      update: { mimeType: dto.mimeType, data },
    });

    // The image itself is not copied into the log — only that it changed.
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "student.photo.set",
      entityType: "Student",
      entityId: studentId,
      after: { admissionNo: student.admissionNo, bytes: data.length },
    });

    return { updatedAt: photo.updatedAt };
  }

  private async findStudentOrThrow(actor: AuthenticatedStaff, studentId: string) {
    const scope = await this.access.studentScope(actor);
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId: actor.schoolId, AND: [AccessScopeService.studentWhere(scope)] },
      select: { id: true, admissionNo: true },
    });
    if (!student) throw new NotFoundException("Student not found.");
    return student;
  }
}
