import { Module } from "@nestjs/common";
import { SchoolProfileController } from "@/school/school-profile.controller";
import { SchoolProfileService } from "@/school/school-profile.service";

@Module({
  controllers: [SchoolProfileController],
  providers: [SchoolProfileService],
})
export class SchoolModule {}
