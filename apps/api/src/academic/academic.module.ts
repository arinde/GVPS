import { Module } from "@nestjs/common";
import { AcademicController } from "@/academic/academic.controller";
import { ClassStructureService } from "@/academic/class-structure.service";
import { SessionService } from "@/academic/session.service";

// Sessions, terms, levels and arms (FEATURES.md §2). Exported because the
// students and enrolment modules resolve the current session and the target
// arm through these services rather than querying the tables directly.
@Module({
  controllers: [AcademicController],
  providers: [SessionService, ClassStructureService],
  exports: [SessionService, ClassStructureService],
})
export class AcademicModule {}
