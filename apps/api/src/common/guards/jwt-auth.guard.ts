import { ForbiddenException, Injectable, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { SKIP_PASSWORD_CHANGE_CHECK_KEY } from "@/common/decorators/skip-password-change-check.decorator";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

/**
 * Verifies the access token (via the "jwt" passport strategy), then enforces
 * FEATURES.md §1.2's forced password change: every route is blocked for a
 * staff member with mustChangePassword set, except ones marked
 * @SkipPasswordChangeCheck() (change-password itself, logout).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    const skipCheck = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_PASSWORD_CHANGE_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCheck) return true;

    const { user } = context.switchToHttp().getRequest<Request & { user: AuthenticatedStaff }>();
    if (user.mustChangePassword) {
      throw new ForbiddenException("Password change required before continuing.");
    }
    return true;
  }
}
