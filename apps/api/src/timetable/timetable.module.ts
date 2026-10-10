import { Module } from "@nestjs/common";
import { PeriodsController } from "@/timetable/periods.controller";
import { PeriodsService } from "@/timetable/periods.service";
import { TimetableController } from "@/timetable/timetable.controller";
import { TimetableService } from "@/timetable/timetable.service";

@Module({
  controllers: [PeriodsController, TimetableController],
  providers: [PeriodsService, TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}
