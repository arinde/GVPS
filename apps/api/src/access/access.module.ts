import { Global, Module } from "@nestjs/common";
import { AccessController } from "@/access/access.controller";
import { AccessScopeService } from "@/access/access-scope.service";

// Global because every module holding student data must scope by it, and a
// module that forgot to import it would fail open rather than closed.
@Global()
@Module({
  controllers: [AccessController],
  providers: [AccessScopeService],
  exports: [AccessScopeService],
})
export class AccessModule {}
