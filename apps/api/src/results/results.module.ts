import { Module } from "@nestjs/common";
import { StudentResultsController } from "@/results/student-results.controller";
import { StudentResultsService } from "@/results/student-results.service";

@Module({
  controllers: [StudentResultsController],
  providers: [StudentResultsService],
})
export class ResultsModule {}
