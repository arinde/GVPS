import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { EnquiryStatus, Role } from "@prisma/client";
import type { Request } from "express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import {
  ENQUIRY_INTERESTS,
  SubmitEnquirySchema,
  UpdateEnquirySchema,
  type SubmitEnquiryDto,
  type UpdateEnquiryDto,
} from "@/enquiries/enquiries.schemas";
import { EnquiriesService } from "@/enquiries/enquiries.service";

/** The public half: no sign-in. Visitors can see the options and send an enquiry, nothing else. */
@Controller("public/enquiries")
export class PublicEnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get("options")
  options() {
    return { interests: ENQUIRY_INTERESTS };
  }

  @Post()
  submit(@Req() req: Request, @Body(new ZodValidationPipe(SubmitEnquirySchema)) body: SubmitEnquiryDto) {
    return this.enquiries.submit(req.ip ?? "unknown", body);
  }
}

// The office half: admissions is office work (FEATURES.md §1.1), so the
// superadmin, principal and secretary read and follow up enquiries.
@Controller("enquiries")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.PRINCIPAL, Role.ADMIN_SECRETARY)
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Get()
  list(@CurrentUser() actor: AuthenticatedStaff, @Query("status") status?: string) {
    const valid = Object.values(EnquiryStatus).find((value) => value === status);
    return this.enquiries.list(actor.schoolId, valid);
  }

  @Patch(":enquiryId")
  update(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("enquiryId") enquiryId: string,
    @Body(new ZodValidationPipe(UpdateEnquirySchema)) body: UpdateEnquiryDto,
  ) {
    return this.enquiries.update(actor, enquiryId, body);
  }
}
