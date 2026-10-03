import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { z } from "zod";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { AuditTrailService } from "@/audit/audit-trail.service";

const EmailTrailQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

// FEATURES.md §11.5: the audit log is for the proprietor and principal only.
@Controller("audit")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.PRINCIPAL)
export class AuditTrailController {
  constructor(private readonly trail: AuditTrailService) {}

  @Get("emails")
  emails(
    @CurrentUser() actor: AuthenticatedStaff,
    @Query(new ZodValidationPipe(EmailTrailQuerySchema)) query: z.infer<typeof EmailTrailQuerySchema>,
  ) {
    return this.trail.emails(actor.schoolId, query.page, query.pageSize);
  }
}
