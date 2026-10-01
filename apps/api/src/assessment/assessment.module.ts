import { Module } from "@nestjs/common";
import { AssessmentController } from "@/assessment/assessment.controller";
import { AssessmentService } from "@/assessment/assessment.service";
import { ScoreEntryController } from "@/assessment/score-entry.controller";
import { ScoreEntryService } from "@/assessment/score-entry.service";

@Module({
  controllers: [AssessmentController, ScoreEntryController],
  providers: [AssessmentService, ScoreEntryService],
  exports: [AssessmentService, ScoreEntryService],
})
export class AssessmentModule {}
