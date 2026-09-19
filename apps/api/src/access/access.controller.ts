import { Controller, Get, UseGuards } from "@nestjs/common";
import { mayRegisterAnywhere, mayRegisterAtAll } from "@/access/access-scope";
import { AccessScopeService } from "@/access/access-scope.service";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

/**
 * What the signed-in person can see and do, so the web app can offer only
 * what will work — a teacher's class dropdown lists their own classes.
 *
 * Presentation only. Every student endpoint re-checks through
 * AccessScopeService regardless of what the client was shown (FEATURES.md §1.5).
 */
@Controller("access")
@UseGuards(JwtAuthGuard)
export class AccessController {
  constructor(
    private readonly access: AccessScopeService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("me")
  async me(@CurrentUser() actor: AuthenticatedStaff) {
    const scope = await this.access.studentScope(actor);
    const { armIds } = await this.access.allocatedArms(actor);

    // Who is signed in and where, for the app shell: the sidebar shows the
    // school's name and the top bar shows the person's (STITCH-GLOBAL.md §6–7).
    const [school, staff] = await Promise.all([
      this.prisma.school.findUniqueOrThrow({ where: { id: actor.schoolId }, select: { name: true } }),
      this.prisma.staff.findUniqueOrThrow({
        where: { id: actor.id },
        select: { firstName: true, lastName: true, email: true },
      }),
    ]);

    const allocatedArms = await this.prisma.classArm.findMany({
      where: { id: { in: armIds }, schoolId: actor.schoolId },
      include: { classLevel: true },
      orderBy: [{ classLevel: { rank: "asc" } }, { name: "asc" }],
    });

    return {
      school,
      staff,
      scope: scope.kind,
      allocatedArms,
      canRegister: mayRegisterAtAll(actor.roles),
      // True when registration is not limited to allocated arms.
      registersAnywhere: mayRegisterAnywhere(actor.roles),
    };
  }
}
