import { Module } from "@nestjs/common";
import { SystemHealthController } from "@/system-health/system-health.controller";
import { SystemHealthService } from "@/system-health/system-health.service";

@Module({
  controllers: [SystemHealthController],
  providers: [SystemHealthService],
})
export class SystemHealthModule {}
