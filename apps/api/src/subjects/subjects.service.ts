import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Section } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { auditDiff } from "@/common/audit-diff";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { AddOfferingsDto, SubjectDto, UpdateOfferingDto } from "@/subjects/subjects.schemas";

const fieldError = (path: string, message: string) => new BadRequestException([{ path: [path], message }]);

/**
 * The subject catalogue and where each subject is offered (FEATURES.md §2.3).
 * Written by the superadmin and principal; read by any staff member. Every
 * change is audited.
 */
@Injectable()
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      include: {
        offerings: {
          orderBy: [{ classLevel: { rank: "asc" } }, { stream: "asc" }],
          include: { classLevel: { select: { id: true, name: true, section: true, rank: true } } },
        },
      },
    });
  }

  async create(actor: AuthenticatedStaff, dto: SubjectDto) {
    await this.assertUnique(actor.schoolId, dto);
    const subject = await this.prisma.subject.create({ data: { schoolId: actor.schoolId, ...dto } });
    await this.record(actor, "subject.created", subject.id, { after: dto });
    return subject;
  }

  async update(actor: AuthenticatedStaff, subjectId: string, dto: SubjectDto) {
    const existing = await this.findOrThrow(actor.schoolId, subjectId);
    await this.assertUnique(actor.schoolId, dto, subjectId);
    const diff = auditDiff(existing, dto);
    if (!diff) return existing;
    const subject = await this.prisma.subject.update({ where: { id: subjectId }, data: dto });
    await this.record(actor, "subject.updated", subjectId, { before: diff.before, after: diff.after });
    return subject;
  }

  /** Refused while anyone teaches it: removing it would silently unassign those teachers. */
  async remove(actor: AuthenticatedStaff, subjectId: string) {
    const subject = await this.findOrThrow(actor.schoolId, subjectId);
    const taught = await this.prisma.subjectAssignment.count({ where: { subjectId } });
    if (taught) {
      throw new ConflictException(`${subject.name} is assigned to teachers. Remove those assignments first.`);
    }
    await this.prisma.subject.delete({ where: { id: subjectId } });
    await this.record(actor, "subject.deleted", subjectId, { before: { name: subject.name, code: subject.code } });
  }

  async addOfferings(actor: AuthenticatedStaff, subjectId: string, dto: AddOfferingsDto) {
    const subject = await this.findOrThrow(actor.schoolId, subjectId);
    const levels = await this.prisma.classLevel.findMany({
      where: { schoolId: actor.schoolId, id: { in: dto.classLevelIds } },
    });
    if (levels.length !== dto.classLevelIds.length) throw fieldError("classLevelIds", "Choose levels from the list");
    // A department only exists at senior levels (the same rule as enrolment).
    if (dto.stream && levels.some((level) => level.section !== Section.SENIOR)) {
      throw fieldError("stream", "A department can only be set for SSS levels");
    }

    const created = await this.prisma.subjectOffering.createMany({
      data: levels.map((level) => ({
        schoolId: actor.schoolId,
        subjectId,
        classLevelId: level.id,
        stream: dto.stream ?? null,
        isCore: dto.isCore,
      })),
      // Offering it again at a level that already has it changes nothing.
      skipDuplicates: true,
    });
    await this.record(actor, "subject.offered", subjectId, {
      after: { subject: subject.name, levels: levels.map((level) => level.name), stream: dto.stream ?? null },
    });
    return { added: created.count };
  }

  async updateOffering(actor: AuthenticatedStaff, offeringId: string, dto: UpdateOfferingDto) {
    const offering = await this.findOfferingOrThrow(actor.schoolId, offeringId);
    const diff = auditDiff(offering, dto);
    if (!diff) return offering;
    const updated = await this.prisma.subjectOffering.update({ where: { id: offeringId }, data: dto });
    await this.record(actor, "subject.offering.updated", offering.subjectId, {
      before: diff.before,
      after: { ...diff.after, subject: offering.subject.name, level: offering.classLevel.name },
    });
    return updated;
  }

  async removeOffering(actor: AuthenticatedStaff, offeringId: string) {
    const offering = await this.findOfferingOrThrow(actor.schoolId, offeringId);
    const taught = await this.prisma.subjectAssignment.count({
      where: { subjectId: offering.subjectId, classArm: { classLevelId: offering.classLevelId } },
    });
    if (taught) {
      throw new ConflictException(
        `${offering.subject.name} has teachers in ${offering.classLevel.name}. Remove those assignments first.`,
      );
    }
    await this.prisma.subjectOffering.delete({ where: { id: offeringId } });
    await this.record(actor, "subject.offering.removed", offering.subjectId, {
      before: { subject: offering.subject.name, level: offering.classLevel.name, stream: offering.stream },
    });
  }

  private async assertUnique(schoolId: string, dto: SubjectDto, exceptId?: string) {
    const clash = await this.prisma.subject.findFirst({
      where: { schoolId, id: exceptId ? { not: exceptId } : undefined, OR: [{ name: dto.name }, { code: dto.code }] },
    });
    if (!clash) return;
    throw clash.name === dto.name
      ? new ConflictException([{ path: ["name"], message: "A subject with this name already exists" }])
      : new ConflictException([{ path: ["code"], message: `${clash.name} already uses this code` }]);
  }

  private async findOrThrow(schoolId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id: subjectId, schoolId } });
    if (!subject) throw new NotFoundException("Subject not found.");
    return subject;
  }

  private async findOfferingOrThrow(schoolId: string, offeringId: string) {
    const offering = await this.prisma.subjectOffering.findFirst({
      where: { id: offeringId, schoolId },
      include: { subject: true, classLevel: true },
    });
    if (!offering) throw new NotFoundException("Offering not found.");
    return offering;
  }

  private record(
    actor: AuthenticatedStaff,
    action: string,
    subjectId: string,
    change: { before?: unknown; after?: unknown },
  ) {
    return this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action,
      entityType: "Subject",
      entityId: subjectId,
      ...change,
    });
  }
}
