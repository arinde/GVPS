import { Module } from "@nestjs/common";
import { PeriodsController } from "@/timetable/periods.controller";
import { PeriodsService } from "@/timetable/periods.service";
import { TimetableController } from "@/timetable/timetable.controller";
import { TimetableSubjectsService } from "@/timetable/timetable-subjects.service";
import { TimetableService } from "@/timetable/timetable.service";

@Module({
  controllers: [PeriodsController, TimetableController],
  providers: [PeriodsService, TimetableService, TimetableSubjectsService],
  exports: [TimetableService],
})
export class TimetableModule {}
