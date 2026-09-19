import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "@/auth/auth.controller";
import { AuthService } from "@/auth/auth.service";
import { MeController } from "@/auth/me.controller";
import { StaffAccountController } from "@/auth/staff-account.controller";
import { StaffAccountService } from "@/auth/staff-account.service";
import { JwtStrategy } from "@/auth/strategies/jwt.strategy";

@Module({
  // AuthService signs tokens with an explicit secret/expiry per call
  // (staff vs. a future parent-token type may need different lifetimes),
  // so JwtModule itself needs no default configuration.
  imports: [PassportModule.register({ defaultStrategy: "jwt" }), JwtModule.register({})],
  controllers: [AuthController, StaffAccountController, MeController],
  providers: [AuthService, StaffAccountService, JwtStrategy],
})
export class AuthModule {}
