import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EnrolmentStatus } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { ExitDto, TransferDto } from "@/promotions/promotions.schemas";
import { resolveStream } from "@/students/registration-rules";

const armLabel = (arm: { name: string; classLevel: { name: string } }) => `${arm.classLevel.name}${arm.name}`;

/**
 * Moving a student within a session, and recording that one has left
 * (FEATURES.md §3.6). Both edit the enrolment in place, unlike promotion,
 * because they correct or close the year the student is already in.
 */
@Injectable()
export class EnrolmentChangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Moves a student to another class in the same session — a correction or a class change. */
  async transfer(actor: AuthenticatedStaff, enrolmentId: string, dto: TransferDto) {
    const enrolment = await this.enrolmentOrThrow(actor.schoolId, enrolmentId);
    if (enrolment.status !== EnrolmentStatus.ACTIVE) {
      throw new BadRequestException("This student is no longer active in that session.");
    }
    const arm = await this.prisma.classArm.findFirst({
      where: { id: dto.classArmId, schoolId: actor.schoolId },
      include: { classLevel: true },
    });
    if (!arm) throw new BadRequestException([{ path: ["classArmId"], message: "Choose a class from the list" }]);
    if (arm.id === enrolment.classArmId) return enrolment;

    const stream = resolveStream(arm, dto.stream);
    const updated = await this.prisma.enrolment.update({
      where: { id: enrolmentId },
      data: { classArmId: arm.id, stream },
    });

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "student.transferred",
      entityType: "Student",
      entityId: enrolment.studentId,
      before: { class: armLabel(enrolment.classArm), stream: enrolment.stream },
      after: {
        class: armLabel(arm),
        stream,
        session: enrolment.session.name,
        admissionNo: enrolment.student.admissionNo,
        reason: dto.reason ?? null,
      },
    });
    return updated;
  }

  /** Records that a student left: transferred out, withdrawn, or graduated. */
  async exit(actor: AuthenticatedStaff, enrolmentId: string, dto: ExitDto) {
    const enrolment = await this.enrolmentOrThrow(actor.schoolId, enrolmentId);
    const exitedOn = new Date(dto.exitedOn);
    if (exitedOn < enrolment.enrolledOn) {
      throw new BadRequestException([{ path: ["exitedOn"], message: "A student cannot leave before they enrolled" }]);
    }

    const updated = await this.prisma.enrolment.update({
      where: { id: enrolmentId },
      data: { status: dto.status, exitedOn, exitReason: dto.reason ?? null },
    });

    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "student.exited",
      entityType: "Student",
      entityId: enrolment.studentId,
      before: { status: enrolment.status },
      after: {
        status: dto.status,
        class: armLabel(enrolment.classArm),
        session: enrolment.session.name,
        admissionNo: enrolment.student.admissionNo,
        exitedOn: dto.exitedOn,
        reason: dto.reason ?? null,
      },
    });
    return updated;
  }

  private async enrolmentOrThrow(schoolId: string, enrolmentId: string) {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { id: enrolmentId, schoolId },
      include: { classArm: { include: { classLevel: true } }, session: true, student: true },
    });
    if (!enrolment) throw new NotFoundException("Enrolment not found.");
    return enrolment;
  }
}
