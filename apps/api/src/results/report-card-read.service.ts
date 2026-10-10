import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { AccessScopeService } from "@/access/access-scope.service";
import { isReportCard } from "@/assessment/report-card";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { PrismaService } from "@/prisma/prisma.service";

// FEATURES.md §14 "Report cards": superadmin, principal and admin/secretary
// read the whole school; a form teacher reads their own arm. Bursar and
// subject teachers have no report-card access. Parents use the portal.
const WHOLE_SCHOOL: Role[] = [Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY];

@Injectable()
export class ReportCardReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessScopeService,
  ) {}

  async forStudent(actor: AuthenticatedStaff, termId: string, studentId: string) {
    const card = await this.prisma.reportCard.findFirst({
      where: { schoolId: actor.schoolId, termId, studentId },
      select: { classArmId: true, frozen: true },
    });
    if (!card) throw new NotFoundException("This report card has not been published yet.");

    if (!actor.roles.some((role) => WHOLE_SCHOOL.includes(role))) {
      if (!actor.roles.includes(Role.FORM_TEACHER)) {
        throw new ForbiddenException("You do not have access to report cards.");
      }
      const { armIds } = await this.access.allocatedArms(actor);
      if (!armIds.includes(card.classArmId)) {
        throw new ForbiddenException("This student is not in one of your classes.");
      }
    }

    if (!isReportCard(card.frozen)) throw new NotFoundException("This report card could not be read.");
    return card.frozen;
  }
}
