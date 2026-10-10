import { Module } from "@nestjs/common";
import { BroadsheetController } from "@/results/broadsheet.controller";
import { BroadsheetService } from "@/results/broadsheet.service";
import { ReportCardController } from "@/results/report-card.controller";
import { ReportCardReadService } from "@/results/report-card-read.service";
import { StudentResultsController } from "@/results/student-results.controller";
import { StudentResultsService } from "@/results/student-results.service";

@Module({
  controllers: [StudentResultsController, ReportCardController, BroadsheetController],
  providers: [StudentResultsService, ReportCardReadService, BroadsheetService],
})
export class ResultsModule {}
