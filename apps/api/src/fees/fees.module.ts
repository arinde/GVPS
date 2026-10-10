import { Module } from "@nestjs/common";
import { DebtorsController } from "@/fees/debtors.controller";
import { DebtorsService } from "@/fees/debtors.service";
import { FeeStructureController } from "@/fees/fee-structure.controller";
import { FeeStructureService } from "@/fees/fee-structure.service";
import { InvoicingController } from "@/fees/invoicing.controller";
import { InvoicingService } from "@/fees/invoicing.service";
import { PaymentsController } from "@/fees/payments.controller";
import { PaymentsService } from "@/fees/payments.service";

@Module({
  controllers: [FeeStructureController, InvoicingController, PaymentsController, DebtorsController],
  providers: [FeeStructureService, InvoicingService, PaymentsService, DebtorsService],
  exports: [FeeStructureService, InvoicingService, PaymentsService, DebtorsService],
})
export class FeesModule {}
