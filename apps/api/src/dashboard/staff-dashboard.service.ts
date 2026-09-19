import { Injectable } from "@nestjs/common";
import { EnrolmentStatus, Sex, type Prisma } from "@prisma/client";
import { mayRegisterAtAll } from "@/access/access-scope";
import { AccessScopeService } from "@/access/access-scope.service";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

const RECENT = 6;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Every staff member's home page (STITCH-SCREENS.md screen 13, limited to
 * Phase 1's data): their classes, the students in them, and what needs doing.
 * A teacher sees only their allocated classes; school-wide roles such as the
 * secretary see the whole school. The same scope as every student read, so
 * the dashboard can never show a name the registry would hide.
 */
@Injectable()
export class StaffDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessScopeService,
  ) {}

  async overview(actor: AuthenticatedStaff) {
    const { schoolId } = actor;
    const session = await this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } });
    const scope = await this.access.studentScope(actor);
    const students: Prisma.StudentWhereInput = { schoolId, AND: [AccessScopeService.studentWhere(scope)] };
    const armFilter: Prisma.ClassArmWhereInput = scope.kind === "arms" ? { id: { in: scope.armIds } } : {};
    const activeHere = { sessionId: session?.id ?? "", status: EnrolmentStatus.ACTIVE };

    const [arms, total, registeredThisWeek, withoutPhoto, recent] = await Promise.all([
      this.prisma.classArm.findMany({
        where: { schoolId, ...armFilter },
        orderBy: [{ classLevel: { rank: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          capacity: true,
          classLevel: { select: { name: true } },
          enrolments: { where: activeHere, select: { student: { select: { sex: true } } } },
        },
      }),
      this.prisma.student.count({ where: students }),
      this.prisma.student.count({ where: { ...students, createdAt: { gte: new Date(Date.now() - WEEK_MS) } } }),
      this.prisma.student.count({ where: { ...students, photo: { is: null } } }),
      this.prisma.student.findMany({
        where: students,
        orderBy: { createdAt: "desc" },
        take: RECENT,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          createdAt: true,
          enrolments: {
            where: activeHere,
            take: 1,
            select: { classArm: { select: { name: true, classLevel: { select: { name: true } } } } },
          },
        },
      }),
    ]);

    return {
      session: session ? { name: session.name } : null,
      scope: scope.kind,
      canRegister: mayRegisterAtAll(actor.roles),
      students: { total, registeredThisWeek, withoutPhoto },
      classes: arms.map((arm) => ({
        id: arm.id,
        label: `${arm.classLevel.name}${arm.name}`,
        enrolled: arm.enrolments.length,
        capacity: arm.capacity,
        girls: arm.enrolments.filter(({ student }) => student.sex === Sex.FEMALE).length,
        boys: arm.enrolments.filter(({ student }) => student.sex === Sex.MALE).length,
      })),
      recent: recent.map((student) => {
        const arm = student.enrolments[0]?.classArm;
        return {
          id: student.id,
          name: `${student.lastName}, ${student.firstName}`,
          admissionNo: student.admissionNo,
          className: arm ? `${arm.classLevel.name}${arm.name}` : null,
          registeredAt: student.createdAt,
        };
      }),
    };
  }
}
