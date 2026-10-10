import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role, Section } from "@prisma/client";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";
import type { CreatePeriodDto, UpdatePeriodDto } from "@/timetable/schemas/timetable.schema";

/** FEATURES.md §8.1 — the daily period structure (teaching slots, breaks, assembly) for one section. */
@Injectable()
export class PeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  list(actor: AuthenticatedStaff, section: Section) {
    if (actor.roles.includes(Role.BURSAR)) throw new ForbiddenException("You do not have access to the timetable.");
    return this.prisma.period.findMany({ where: { schoolId: actor.schoolId, section }, orderBy: { sequence: "asc" } });
  }

  async create(actor: AuthenticatedStaff, dto: CreatePeriodDto) {
    const last = await this.prisma.period.findFirst({
      where: { schoolId: actor.schoolId, section: dto.section },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    return this.prisma.period.create({
      data: {
        schoolId: actor.schoolId,
        section: dto.section,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isTeaching: dto.isTeaching,
        sequence: (last?.sequence ?? 0) + 1,
      },
    });
  }

  async update(actor: AuthenticatedStaff, periodId: string, dto: UpdatePeriodDto) {
    const period = await this.prisma.period.findFirst({ where: { id: periodId, schoolId: actor.schoolId } });
    if (!period) throw new NotFoundException("Period not found.");
    return this.prisma.period.update({ where: { id: periodId }, data: dto });
  }

  /** Blocked while any lesson still uses it — clear the timetable for this period first. */
  async remove(actor: AuthenticatedStaff, periodId: string): Promise<void> {
    const period = await this.prisma.period.findFirst({ where: { id: periodId, schoolId: actor.schoolId } });
    if (!period) throw new NotFoundException("Period not found.");

    const inUse = await this.prisma.timetableSlot.count({ where: { periodId } });
    if (inUse > 0) {
      throw new ConflictException(`${inUse} lesson${inUse === 1 ? " is" : "s are"} still scheduled in this period.`);
    }
    await this.prisma.period.delete({ where: { id: periodId } });
  }
}
