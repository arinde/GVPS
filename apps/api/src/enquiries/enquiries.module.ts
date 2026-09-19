import { Global, Module } from "@nestjs/common";
import { EnquiriesController, PublicEnquiriesController } from "@/enquiries/enquiries.controller";
import { EnquiriesService } from "@/enquiries/enquiries.service";

// Admission enquiries from the landing page. Global so the dashboard can count new ones.
@Global()
@Module({
  controllers: [PublicEnquiriesController, EnquiriesController],
  providers: [EnquiriesService],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
