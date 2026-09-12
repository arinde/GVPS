import { Global, Module } from "@nestjs/common";
import { AuditService } from "@/audit/audit.service";

// Global for the same reason as PrismaModule: every future domain module
// will want to write an audit entry without re-importing this module.
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
