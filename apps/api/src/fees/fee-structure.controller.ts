import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { FeeStructureService } from "@/fees/fee-structure.service";
import {
  CreateFeeItemSchema,
  SetFeeStructureItemSchema,
  type CreateFeeItemDto,
  type SetFeeStructureItemDto,
} from "@/fees/schemas/fees.schemas";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

// FEATURES.md §14 "Fee structure" row: superadmin and bursar write; principal
// reads; everyone else (form/subject teacher, admin, parent) has no access
// at all — unlike most other modules, this one isn't even readable by them.
const STRUCTURE_READERS = [Role.SUPERADMIN, Role.PRINCIPAL, Role.BURSAR] as const;
const STRUCTURE_WRITERS = [Role.SUPERADMIN, Role.BURSAR] as const;

@Controller("fees/structure")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...STRUCTURE_READERS)
export class FeeStructureController {
  constructor(private readonly structure: FeeStructureService) {}

  @Get("items")
  listFeeItems(@CurrentUser() actor: AuthenticatedStaff) {
    return this.structure.listFeeItems(actor.schoolId);
  }

  @Post("items")
  @Roles(...STRUCTURE_WRITERS)
  createFeeItem(
    @CurrentUser() actor: AuthenticatedStaff,
    @Body(new ZodValidationPipe(CreateFeeItemSchema)) body: CreateFeeItemDto,
  ) {
    return this.structure.createFeeItem(actor, body.name);
  }

  @Get("terms/:termId")
  listStructure(@CurrentUser() actor: AuthenticatedStaff, @Param("termId") termId: string) {
    return this.structure.listStructure(actor.schoolId, termId);
  }

  @Post("terms/:termId")
  @Roles(...STRUCTURE_WRITERS)
  setStructureItem(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Body(new ZodValidationPipe(SetFeeStructureItemSchema)) body: SetFeeStructureItemDto,
  ) {
    return this.structure.setStructureItem(actor, termId, body);
  }

  @Post("terms/:termId/copy-from/:fromTermId")
  @Roles(...STRUCTURE_WRITERS)
  copyStructure(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Param("fromTermId") fromTermId: string,
  ) {
    return this.structure.copyStructure(actor, fromTermId, termId);
  }
}
