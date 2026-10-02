import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import {
  AddInvoiceLineItemSchema,
  GenerateInvoicesSchema,
  type AddInvoiceLineItemDto,
  type GenerateInvoicesDto,
} from "@/fees/schemas/fees.schemas";
import { InvoicingService } from "@/fees/invoicing.service";

// FEATURES.md §14 "Invoices / payments" row: superadmin and bursar, both
// read and write. Principal, teachers and admin have no access at all to
// this controller; parents read their own wards' invoices through the
// portal, not here.
const READERS = [Role.SUPERADMIN, Role.BURSAR] as const;
const WRITERS = [Role.SUPERADMIN, Role.BURSAR] as const;

@Controller("fees/invoices")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...READERS)
export class InvoicingController {
  constructor(private readonly invoicing: InvoicingService) {}

  @Post("terms/:termId/generate")
  @Roles(...WRITERS)
  generateForArm(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("termId") termId: string,
    @Body(new ZodValidationPipe(GenerateInvoicesSchema)) body: GenerateInvoicesDto,
  ) {
    return this.invoicing.generateForArm(actor, termId, body.classArmId);
  }

  @Get(":invoiceId")
  getInvoice(@CurrentUser() actor: AuthenticatedStaff, @Param("invoiceId") invoiceId: string) {
    return this.invoicing.getInvoice(actor, invoiceId);
  }

  @Post(":invoiceId/line-items")
  @Roles(...WRITERS)
  addLineItem(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("invoiceId") invoiceId: string,
    @Body(new ZodValidationPipe(AddInvoiceLineItemSchema)) body: AddInvoiceLineItemDto,
  ) {
    return this.invoicing.addLineItem(actor, invoiceId, body.feeItemId);
  }

  @Get("students/:studentId/ledger")
  getStudentLedger(@CurrentUser() actor: AuthenticatedStaff, @Param("studentId") studentId: string) {
    return this.invoicing.getStudentLedger(actor, studentId);
  }
}
