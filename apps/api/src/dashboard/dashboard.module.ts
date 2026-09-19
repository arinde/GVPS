import { Module } from "@nestjs/common";
import { DashboardController } from "@/dashboard/dashboard.controller";
import { DashboardService } from "@/dashboard/dashboard.service";
import { StaffDashboardService } from "@/dashboard/staff-dashboard.service";

// Home pages: the leadership overview (screen 1) and every staff member's own (screen 13).
@Module({
  controllers: [DashboardController],
  providers: [DashboardService, StaffDashboardService],
})
export class DashboardModule {}
