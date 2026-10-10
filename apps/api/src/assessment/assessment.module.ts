import { Module } from "@nestjs/common";
import { AssessmentController } from "@/assessment/assessment.controller";
import { AssessmentService } from "@/assessment/assessment.service";
import { RemarksController } from "@/assessment/remarks.controller";
import { RemarksService } from "@/assessment/remarks.service";
import { ReportCardPublisher } from "@/assessment/report-card-publisher.service";
import { ResultApprovalController } from "@/assessment/result-approval.controller";
import { ResultApprovalService } from "@/assessment/result-approval.service";
import { ScoreEntryController } from "@/assessment/score-entry.controller";
import { ScoreEntryService } from "@/assessment/score-entry.service";

@Module({
  controllers: [AssessmentController, ScoreEntryController, ResultApprovalController, RemarksController],
  providers: [AssessmentService, ScoreEntryService, ResultApprovalService, ReportCardPublisher, RemarksService],
  exports: [AssessmentService, ScoreEntryService, ResultApprovalService],
})
export class AssessmentModule {}
