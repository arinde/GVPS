import { Module } from "@nestjs/common";
import { AdmissionNumberService } from "@/students/admission-number.service";
import { StudentsController } from "@/students/students.controller";
import { StudentsService } from "@/students/students.service";

// Student registry, guardians and enrolment (FEATURES.md §3.2-3.4).
@Module({
  controllers: [StudentsController],
  providers: [StudentsService, AdmissionNumberService],
  exports: [StudentsService],
})
export class StudentsModule {}
