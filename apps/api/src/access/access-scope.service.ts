import { Injectable } from "@nestjs/common";
import { EnrolmentStatus, type Prisma } from "@prisma/client";
import { scopeFor, type StudentScope } from "@/access/access-scope";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * Resolves a signed-in staff member's access from their roles and this
 * session's class allocations.
 *
 * Allocations are read from the database on every request rather than baked
 * into the access token, so taking a class away from a teacher takes effect
 * on their next click, not after their token expires.
 */
@Injectable()
export class AccessScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /** The arms allocated to this staff member in the current session. */
  async allocatedArms(actor: AuthenticatedStaff): Promise<{ sessionId: string | null; armIds: string[] }> {
    const session = await this.prisma.academicSession.findFirst({
      where: { schoolId: actor.schoolId, isCurrent: true },
      select: { id: true },
    });
    if (!session) return { sessionId: null, armIds: [] };

    const assignments = await this.prisma.classAssignment.findMany({
      where: { schoolId: actor.schoolId, sessionId: session.id, staffId: actor.id },
      select: { classArmId: true },
    });
    return { sessionId: session.id, armIds: assignments.map((assignment) => assignment.classArmId) };
  }

  /**
   * Who a staff member may read: their form classes plus every class they
   * teach a subject in (FEATURES.md §1.5 — a subject teacher's scope is their
   * subject × arm assignments). Registration still uses allocatedArms alone:
   * teaching a subject in a class does not make it yours to register into.
   */
  async studentScope(actor: AuthenticatedStaff): Promise<StudentScope> {
    const { sessionId, armIds } = await this.allocatedArms(actor);
    const taught = sessionId
      ? await this.prisma.subjectAssignment.findMany({
          where: { schoolId: actor.schoolId, sessionId, staffId: actor.id },
          select: { classArmId: true },
          distinct: ["classArmId"],
        })
      : [];
    const readable = [...new Set([...armIds, ...taught.map((row) => row.classArmId)])];
    return scopeFor(actor.roles, sessionId, readable);
  }

  /**
   * The Prisma filter that limits a student query to a scope. Every student
   * query goes through this, so the rule lives in one place.
   */
  static studentWhere(scope: StudentScope): Prisma.StudentWhereInput {
    if (scope.kind === "school") return {};
    return {
      enrolments: {
        some: {
          classArmId: { in: scope.armIds },
          // No current session means nothing is in scope for an arm-scoped
          // reader; the impossible id keeps the filter from matching all.
          sessionId: scope.sessionId ?? "__no_current_session__",
          status: EnrolmentStatus.ACTIVE,
        },
      },
    };
  }
}
