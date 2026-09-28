import { Module } from "@nestjs/common";
import { EnrolmentChangesService } from "@/promotions/enrolment-changes.service";
import { EnrolmentsController, PromotionsController } from "@/promotions/promotions.controller";
import { PromotionsService } from "@/promotions/promotions.service";
import { AdmissionNumberService } from "@/students/admission-number.service";

// Movement and exit (FEATURES.md §3.6): promotion into the next session,
// transfer within a session, and recording that a student has left.
@Module({
  controllers: [PromotionsController, EnrolmentsController],
  providers: [PromotionsService, EnrolmentChangesService, AdmissionNumberService],
})
export class PromotionsModule {}
