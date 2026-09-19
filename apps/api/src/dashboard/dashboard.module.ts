import { Module } from "@nestjs/common";
import { DashboardController } from "@/dashboard/dashboard.controller";
import { DashboardService } from "@/dashboard/dashboard.service";

// The superadmin and principal overview (STITCH-SCREENS.md screen 1).
@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
