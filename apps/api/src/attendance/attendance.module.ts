import { Module } from "@nestjs/common";
import { AttendanceController } from "@/attendance/attendance.controller";
import { AttendanceService } from "@/attendance/attendance.service";

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
