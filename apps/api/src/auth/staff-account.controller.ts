import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { StaffAccountService } from "@/auth/staff-account.service";
import { CreateStaffSchema, type CreateStaffDto } from "@/auth/schemas/create-staff.schema";
import { GrantRoleSchema, type GrantRoleDto } from "@/auth/schemas/grant-role.schema";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// PLAN.md §4.12: every route here is superadmin-only, kept apart from
// student/guardian record management, which admin/secretary can do freely.
@Controller("auth/staff")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class StaffAccountController {
  constructor(private readonly staffAccounts: StaffAccountService) {}

  @Post()
  createStaff(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(CreateStaffSchema)) body: CreateStaffDto,
  ) {
    return this.staffAccounts.createStaff(actor.id, actor.schoolId, body.email, body.roles);
  }

  @Post(":staffId/roles")
  @HttpCode(HttpStatus.NO_CONTENT)
  grantRole(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("staffId") staffId: string,
    @Body(new ZodValidationPipe(GrantRoleSchema)) body: GrantRoleDto,
  ) {
    return this.staffAccounts.grantRole(actor.id, actor.schoolId, staffId, body.role);
  }

  @Delete(":staffId/roles/:role")
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeRole(@CurrentUser() actor: AuthenticatedStaff, @Param("staffId") staffId: string, @Param("role") role: string) {
    return this.staffAccounts.revokeRole(actor.id, actor.schoolId, staffId, parseRoleParam(role));
  }

  @Post(":staffId/reset-password")
  resetPassword(@CurrentUser() actor: AuthenticatedStaff, @Param("staffId") staffId: string) {
    return this.staffAccounts.resetPassword(actor.id, actor.schoolId, staffId);
  }
}

function parseRoleParam(value: string): Role {
  if (!Object.values(Role).includes(value as Role)) {
    throw new BadRequestException(`Unknown role: ${value}`);
  }
  return value as Role;
}
