import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import { ParentAccessSchema, type ParentAccessDto } from "@/portal/portal.schemas";
import { ParentAccountsService } from "@/portal/parent-accounts.service";

// Staff routes (staff tokens) for managing family-portal logins. Superadmin
// only: a login grants a parent access to children's records.
@Controller("parent-accounts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN)
export class ParentAccountsController {
  constructor(private readonly accounts: ParentAccountsService) {}

  // The number goes in the query as the API stores it (+234…), already
  // normalised by the guardian record the caller read it from.
  @Get()
  status(@CurrentUser() actor: AuthenticatedStaff, @Query("phone") phone?: string) {
    const parsed = ParentAccessSchema.safeParse({ phone: phone ?? "" });
    if (!parsed.success) throw new BadRequestException([{ path: ["phone"], message: "Enter a valid phone number" }]);
    return this.accounts.status(actor.schoolId, parsed.data.phone);
  }

  @Post()
  issue(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(ParentAccessSchema)) body: ParentAccessDto,
  ) {
    return this.accounts.issue(actor, body.phone);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  reset(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(ParentAccessSchema)) body: ParentAccessDto,
  ) {
    return this.accounts.resetPassword(actor, body.phone);
  }
}
