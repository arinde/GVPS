import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";
import {
  RecordPaymentSchema,
  ReversePaymentSchema,
  type RecordPaymentDto,
  type ReversePaymentDto,
} from "@/fees/schemas/fees.schemas";
import { PaymentsService } from "@/fees/payments.service";

// FEATURES.md §14 "Invoices / payments" row: superadmin and bursar, both
// read and write.
@Controller("fees/payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.BURSAR)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post("invoices/:invoiceId")
  record(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("invoiceId") invoiceId: string,
    @Body(new ZodValidationPipe(RecordPaymentSchema)) body: RecordPaymentDto,
  ) {
    return this.payments.record(actor, invoiceId, body);
  }

  @Get(":paymentId/receipt")
  receipt(@CurrentUser() actor: AuthenticatedStaff, @Param("paymentId") paymentId: string) {
    return this.payments.receiptFor(actor, paymentId);
  }

  @Post(":paymentId/reverse")
  reverse(
    @CurrentUser() actor: AuthenticatedStaff,
    @Param("paymentId") paymentId: string,
    @Body(new ZodValidationPipe(ReversePaymentSchema)) body: ReversePaymentDto,
  ) {
    return this.payments.reverse(actor, paymentId, body.reason);
  }
}
