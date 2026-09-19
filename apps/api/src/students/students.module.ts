import { Module } from "@nestjs/common";
import { AdmissionNumberService } from "@/students/admission-number.service";
import { StudentAdminController } from "@/students/student-admin.controller";
import { StudentPhotoController } from "@/students/student-photo.controller";
import { StudentPhotoService } from "@/students/student-photo.service";
import { StudentUpdateService } from "@/students/student-update.service";
import { StudentsController } from "@/students/students.controller";
import { StudentsService } from "@/students/students.service";

// Student registry, guardians and enrolment (FEATURES.md §3.2-3.4).
@Module({
  controllers: [StudentsController, StudentPhotoController, StudentAdminController],
  providers: [StudentsService, AdmissionNumberService, StudentPhotoService, StudentUpdateService],
  exports: [StudentsService],
})
export class StudentsModule {}
