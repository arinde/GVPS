import { Global, Module } from "@nestjs/common";
import { EmailService } from "@/common/email.service";

// Global for the same reason as PrismaModule/AuditModule: every future
// module that notifies someone (payments, results published) needs it.
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
