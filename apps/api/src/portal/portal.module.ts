import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ParentAccountsController } from "@/portal/parent-accounts.controller";
import { ParentAccountsService } from "@/portal/parent-accounts.service";
import { ParentAuthController } from "@/portal/parent-auth.controller";
import { ParentJwtStrategy } from "@/portal/parent-auth.primitives";
import { ParentAuthService } from "@/portal/parent-auth.service";
import { PortalController } from "@/portal/portal.controller";
import { PortalService } from "@/portal/portal.service";

// The family portal: parent sign-in, parents' read-only views of their own
// children, and the school's side of issuing those logins.
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [ParentAuthController, PortalController, ParentAccountsController],
  providers: [ParentAuthService, ParentJwtStrategy, PortalService, ParentAccountsService],
})
export class PortalModule {}
