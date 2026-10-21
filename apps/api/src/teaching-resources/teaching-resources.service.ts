import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, TeachingResourceStatus, type TeachingResourceType } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  RejectTeachingResourceDto,
  SaveTeachingResourceDto,
} from "@/teaching-resources/schemas/teaching-resource.schema";

const APPROVERS: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL];

export type TeachingResourceFilter = {
  type?: TeachingResourceType;
  subjectId?: string;
  classLevelId?: string;
  termId?: string;
};

/**
 * Scheme of work, lecture notes and exam questions — structured templates
 * any staff member fills in for any class (the owner chose plain data entry
 * over an AI draft, and declined to scope this to a teacher's own
 * assignments). draft -> submitted -> approved, mirroring the shape of the
 * result-sheet workflow without its extra "reviewed" rung, since there is no
 * form-teacher step here.
 */
@Injectable()
export class TeachingResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(actor: AuthenticatedStaff, filter: TeachingResourceFilter) {
    return this.prisma.teachingResource.findMany({
      where: {
        schoolId: actor.schoolId,
        type: filter.type,
        subjectId: filter.subjectId,
        classLevelId: filter.classLevelId,
        termId: filter.termId,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async get(actor: AuthenticatedStaff, id: string) {
    return this.findOrThrow(actor.schoolId, id);
  }

  async create(actor: AuthenticatedStaff, dto: SaveTeachingResourceDto) {
    const resource = await this.prisma.teachingResource.create({
      data: {
        schoolId: actor.schoolId,
        type: dto.type,
        title: dto.title,
        subjectId: dto.subjectId,
        classLevelId: dto.classLevelId,
        termId: dto.termId,
        content: dto.content,
        createdById: actor.id,
      },
    });
    await this.record(actor, "teaching-resource.created", resource.id, { type: dto.type, title: dto.title });
    return resource;
  }

  /** Only a draft can be edited — once submitted, it is in the approver's hands. */
  async update(actor: AuthenticatedStaff, id: string, dto: SaveTeachingResourceDto) {
    const existing = await this.findOrThrow(actor.schoolId, id);
    if (existing.status !== TeachingResourceStatus.DRAFT) {
      throw new ConflictException("This has already been submitted and can no longer be edited.");
    }
    if (existing.type !== dto.type) {
      throw new ConflictException("The type of a resource cannot change after it is created.");
    }

    const updated = await this.prisma.teachingResource.update({
      where: { id },
      data: {
        title: dto.title,
        subjectId: dto.subjectId,
        classLevelId: dto.classLevelId,
        termId: dto.termId,
        content: dto.content,
      },
    });
    await this.record(actor, "teaching-resource.updated", id, { title: dto.title });
    return updated;
  }

  async submit(actor: AuthenticatedStaff, id: string) {
    const existing = await this.findOrThrow(actor.schoolId, id);
    if (existing.status !== TeachingResourceStatus.DRAFT) {
      throw new ConflictException("This is not a draft, so it cannot be submitted.");
    }

    const submitted = await this.prisma.teachingResource.update({
      where: { id },
      data: { status: TeachingResourceStatus.SUBMITTED, submittedAt: new Date(), submittedById: actor.id },
    });
    await this.record(actor, "teaching-resource.submitted", id, { title: existing.title });
    return submitted;
  }

  async approve(actor: AuthenticatedStaff, id: string) {
    this.assertApprover(actor);
    const existing = await this.findOrThrow(actor.schoolId, id);
    if (existing.status !== TeachingResourceStatus.SUBMITTED) {
      throw new ConflictException("This has not been submitted, so there is nothing to approve.");
    }

    const approved = await this.prisma.teachingResource.update({
      where: { id },
      data: { status: TeachingResourceStatus.APPROVED, approvedAt: new Date(), approvedById: actor.id },
    });
    await this.record(actor, "teaching-resource.approved", id, { title: existing.title });
    return approved;
  }

  /** Sends a submitted resource back to draft, with a mandatory reason — same spirit as a result-sheet unlock. */
  async reject(actor: AuthenticatedStaff, id: string, dto: RejectTeachingResourceDto) {
    this.assertApprover(actor);
    const existing = await this.findOrThrow(actor.schoolId, id);
    if (existing.status !== TeachingResourceStatus.SUBMITTED) {
      throw new ConflictException("This has not been submitted, so there is nothing to send back.");
    }

    const rejected = await this.prisma.teachingResource.update({
      where: { id },
      data: { status: TeachingResourceStatus.DRAFT, submittedAt: null, submittedById: null },
    });
    await this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action: "teaching-resource.rejected",
      entityType: "TeachingResource",
      entityId: id,
      before: { status: existing.status },
      after: { status: TeachingResourceStatus.DRAFT },
      reason: dto.reason,
    });
    return rejected;
  }

  /** A draft can be removed by whoever wrote it, or by the school's admin tier. Once submitted, it stays as a record. */
  async remove(actor: AuthenticatedStaff, id: string) {
    const existing = await this.findOrThrow(actor.schoolId, id);
    if (existing.status !== TeachingResourceStatus.DRAFT) {
      throw new ConflictException("Only a draft can be deleted.");
    }
    if (existing.createdById !== actor.id && !actor.roles.some((role) => APPROVERS.includes(role))) {
      throw new ForbiddenException("Only the author or an admin can delete this draft.");
    }

    await this.prisma.teachingResource.delete({ where: { id } });
    await this.record(actor, "teaching-resource.deleted", id, { title: existing.title });
  }

  private async findOrThrow(schoolId: string, id: string) {
    const resource = await this.prisma.teachingResource.findFirst({ where: { id, schoolId } });
    if (!resource) throw new NotFoundException("This resource was not found.");
    return resource;
  }

  private assertApprover(actor: AuthenticatedStaff) {
    if (!actor.roles.some((role) => APPROVERS.includes(role))) {
      throw new ForbiddenException("Only the principal or superadmin can approve or reject this.");
    }
  }

  private record(actor: AuthenticatedStaff, action: string, entityId: string, after: Record<string, unknown>) {
    return this.audit.record({
      schoolId: actor.schoolId,
      actorStaffId: actor.id,
      action,
      entityType: "TeachingResource",
      entityId,
      after,
    });
  }
}
