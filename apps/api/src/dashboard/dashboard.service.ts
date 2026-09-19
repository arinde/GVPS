import { Injectable } from "@nestjs/common";
import { EnrolmentStatus, Section } from "@prisma/client";
import { describeActivity } from "@/dashboard/describe-activity";
import { EnquiriesService } from "@/enquiries/enquiries.service";
import { PrismaService } from "@/prisma/prisma.service";

const RECENT_ACTIVITY = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The superadmin's overview (STITCH-SCREENS.md screen 1), limited to what
 * Phase 1 records: the roll, staff, class allocation and the audit log. Fees,
 * attendance and results join as those modules are built.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enquiries: EnquiriesService,
  ) {}

  async overview(schoolId: string) {
    const session = await this.prisma.academicSession.findFirst({ where: { schoolId, isCurrent: true } });
    const sessionId = session?.id ?? "";

    const [arms, staffTotal, passwordNotSet, registeredThisWeek, audit, newEnquiries] = await Promise.all([
      this.prisma.classArm.findMany({
        where: { schoolId },
        orderBy: [{ classLevel: { rank: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          capacity: true,
          classLevel: { select: { name: true, section: true } },
          assignments: { where: { sessionId }, select: { id: true } },
          _count: { select: { enrolments: { where: { sessionId, status: EnrolmentStatus.ACTIVE } } } },
        },
      }),
      this.prisma.staff.count({ where: { schoolId } }),
      this.prisma.staff.count({ where: { schoolId, mustChangePassword: true } }),
      this.prisma.student.count({ where: { schoolId, createdAt: { gte: new Date(Date.now() - WEEK_MS) } } }),
      this.prisma.auditLog.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        take: RECENT_ACTIVITY,
        select: { id: true, action: true, after: true, createdAt: true },
      }),
      this.enquiries.countNew(schoolId),
    ]);

    const bySection = { [Section.NURSERY]: 0, [Section.PRIMARY]: 0, [Section.JUNIOR]: 0, [Section.SENIOR]: 0 };
    for (const arm of arms) bySection[arm.classLevel.section] += arm._count.enrolments;

    return {
      session: session ? { name: session.name } : null,
      students: {
        enrolled: Object.values(bySection).reduce((sum, count) => sum + count, 0),
        bySection,
        registeredThisWeek,
      },
      staff: { total: staffTotal, passwordNotSet },
      enquiries: { new: newEnquiries },
      classes: {
        total: arms.length,
        withoutTeacher: arms.filter((arm) => arm.assignments.length === 0).length,
      },
      progress: arms.map((arm) => ({
        id: arm.id,
        label: `${arm.classLevel.name}${arm.name}`,
        enrolled: arm._count.enrolments,
        capacity: arm.capacity,
      })),
      activity: audit.map((row) => ({ id: row.id, at: row.createdAt, ...describeActivity(row) })),
    };
  }
}
