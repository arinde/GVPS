import { Module } from "@nestjs/common";
import { ReportCardController } from "@/results/report-card.controller";
import { ReportCardReadService } from "@/results/report-card-read.service";
import { StudentResultsController } from "@/results/student-results.controller";
import { StudentResultsService } from "@/results/student-results.service";

@Module({
  controllers: [StudentResultsController, ReportCardController],
  providers: [StudentResultsService, ReportCardReadService],
})
export class ResultsModule {}
