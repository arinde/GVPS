import { Module } from "@nestjs/common";
import { SubjectAssignmentsService } from "@/subjects/subject-assignments.service";
import { SubjectAssignmentsController, SubjectsController } from "@/subjects/subjects.controller";
import { SubjectsService } from "@/subjects/subjects.service";

// Subjects, where they are offered, and who teaches them (FEATURES.md §2.3–2.4).
@Module({
  controllers: [SubjectsController, SubjectAssignmentsController],
  providers: [SubjectsService, SubjectAssignmentsService],
})
export class SubjectsModule {}
