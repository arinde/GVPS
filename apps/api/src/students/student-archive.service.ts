import { Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * FEATURES.md §0 — deleting a student is a soft delete. The record, its fees,
 * payments and results stay for history; the student leaves every list, and
 * their active enrolment is closed as withdrawn so no class still counts them.
 */
@Injectable()
export class StudentArchiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async remove(actor: AuthenticatedStaff, studentId: string, reason: string): Promise<void> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId: actor.schoolId, deletedAt: null },
      select: { id: true },
    });
    if (!student) throw new NotFoundException("Student not found.");

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.student.update({ where: { id: studentId }, data: { deletedAt: now } }),
      this.prisma.enrolment.updateMany({
        where: { studentId, status: EnrolmentStatus.ACTIVE },
        data: { status: EnrolmentStatus.WITHDRAWN, exitedOn: now, exitReason: reason },
      }),
    ]);
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "student.deleted",
      entityType: "Student",
      entityId: studentId,
      reason,
    });
  }
}
