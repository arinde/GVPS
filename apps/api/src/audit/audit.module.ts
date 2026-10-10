import { Global, Module } from "@nestjs/common";
import { AuditService } from "@/audit/audit.service";
import { AuditTrailController } from "@/audit/audit-trail.controller";
import { AuditTrailService } from "@/audit/audit-trail.service";

// Global for the same reason as PrismaModule: every future domain module
// will want to write an audit entry without re-importing this module.
@Global()
@Module({
  controllers: [AuditTrailController],
  providers: [AuditService, AuditTrailService],
  exports: [AuditService],
})
export class AuditModule {}
