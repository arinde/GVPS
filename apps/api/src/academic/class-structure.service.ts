import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Section, type ClassArm, type ClassLevel } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import { PrismaService } from "@/prisma/prisma.service";
import type {
  CreateClassArmDto,
  CreateClassLevelDto,
  UpdateClassArmDto,
} from "@/academic/schemas/class-structure.schema";

/**
 * Class levels and arms (FEATURES.md §2.2).
 *
 * Neither is session-scoped: Primary 4A is the same arm year after year, and
 * what changes annually is who is enrolled into it. That is what keeps
 * enrolment (student × session × arm, PLAN.md §4.2) able to answer "what was
 * Tunde's JSS2 result" forever.
 *
 * Form-teacher ownership is deliberately absent. Putting a teacher id on the
 * arm would lose the history the moment anyone is reassigned — the same trap
 * as class_id on a student. It belongs in the teacher-assignments module
 * (FEATURES.md §2.4) as a session-scoped row.
 */
@Injectable()
export class ClassStructureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createLevel(actorStaffId: string, schoolId: string, dto: CreateClassLevelDto): Promise<ClassLevel> {
    const clash = await this.prisma.classLevel.findFirst({
      where: { schoolId, OR: [{ name: dto.name }, { rank: dto.rank }] },
    });
    if (clash) {
      const field = clash.name === dto.name ? `name "${dto.name}"` : `rank ${dto.rank}`;
      throw new ConflictException(`A class level with ${field} already exists.`);
    }

    const level = await this.prisma.classLevel.create({
      data: { schoolId, section: dto.section, name: dto.name, rank: dto.rank },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.level.created",
      entityType: "ClassLevel",
      entityId: level.id,
      after: { name: level.name, section: level.section, rank: level.rank },
    });

    return level;
  }

  listLevels(schoolId: string) {
    return this.prisma.classLevel.findMany({
      where: { schoolId },
      orderBy: { rank: "asc" },
      include: { arms: { orderBy: { name: "asc" } } },
    });
  }

  async createArm(
    actorStaffId: string,
    schoolId: string,
    classLevelId: string,
    dto: CreateClassArmDto,
  ): Promise<ClassArm> {
    const level = await this.findLevelOrThrow(schoolId, classLevelId);

    // The database enforces this too, via a trigger. Checking here turns a
    // raised Postgres exception into a 400 that names the actual problem.
    if (dto.stream && level.section !== Section.SENIOR) {
      throw new BadRequestException(
        `A stream can only be set on a senior arm. "${level.name}" is ${level.section.toLowerCase()}.`,
      );
    }

    const clash = await this.prisma.classArm.findUnique({
      where: { classLevelId_name: { classLevelId, name: dto.name } },
    });
    if (clash) throw new ConflictException(`${level.name}${dto.name} already exists.`);

    const arm = await this.prisma.classArm.create({
      data: {
        schoolId,
        classLevelId,
        name: dto.name,
        capacity: dto.capacity,
        stream: dto.stream,
      },
    });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.arm.created",
      entityType: "ClassArm",
      entityId: arm.id,
      after: { level: level.name, name: arm.name, stream: arm.stream, capacity: arm.capacity },
    });

    return arm;
  }

  /** Sets or clears a class's size, which the dashboard measures registration against. */
  async updateArm(actorStaffId: string, schoolId: string, armId: string, dto: UpdateClassArmDto): Promise<ClassArm> {
    const arm = await this.prisma.classArm.findFirst({ where: { id: armId, schoolId }, include: { classLevel: true } });
    if (!arm) throw new NotFoundException("Class not found.");
    if (arm.capacity === dto.capacity) return arm;

    const updated = await this.prisma.classArm.update({ where: { id: armId }, data: { capacity: dto.capacity } });

    await this.audit.record({
      schoolId,
      actorStaffId,
      action: "academic.arm.updated",
      entityType: "ClassArm",
      entityId: armId,
      before: { capacity: arm.capacity },
      after: { class: `${arm.classLevel.name}${arm.name}`, capacity: dto.capacity },
    });

    return updated;
  }

  listArms(schoolId: string) {
    return this.prisma.classArm.findMany({
      where: { schoolId },
      orderBy: [{ classLevel: { rank: "asc" } }, { name: "asc" }],
      include: { classLevel: true },
    });
  }

  private async findLevelOrThrow(schoolId: string, classLevelId: string): Promise<ClassLevel> {
    // Scoped by schoolId (PLAN.md §4.1): another school's id reads as absent.
    const level = await this.prisma.classLevel.findFirst({ where: { id: classLevelId, schoolId } });
    if (!level) throw new NotFoundException("Class level not found.");
    return level;
  }
}
