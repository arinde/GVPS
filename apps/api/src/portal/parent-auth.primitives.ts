import { createParamDecorator, ForbiddenException, Injectable, type ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { SKIP_PASSWORD_CHANGE_CHECK_KEY } from "@/common/decorators/skip-password-change-check.decorator";
import { TOKEN_AUDIENCE } from "@/common/secrets";

/** A signed-in parent: one phone number, reaching every child linked to it. */
export type AuthenticatedParent = {
  id: string;
  schoolId: string;
  phone: string;
  mustChangePassword: boolean;
};

export type ParentTokenPayload = {
  sub: string;
  schoolId: string;
  phone: string;
  mustChangePassword: boolean;
};

/** Verifies parent-portal access tokens only — the parent audience, never staff. */
@Injectable()
export class ParentJwtStrategy extends PassportStrategy(Strategy, "parent-jwt") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      audience: TOKEN_AUDIENCE.parent,
    });
  }

  validate(payload: ParentTokenPayload): AuthenticatedParent {
    return {
      id: payload.sub,
      schoolId: payload.schoolId,
      phone: payload.phone,
      mustChangePassword: payload.mustChangePassword,
    };
  }
}

/**
 * The parent-portal twin of JwtAuthGuard: verifies the token, then blocks
 * everything but @SkipPasswordChangeCheck() routes until the temporary
 * password from the slip has been changed.
 */
@Injectable()
export class ParentAuthGuard extends AuthGuard("parent-jwt") {
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

    const { user } = context.switchToHttp().getRequest<Request & { user: AuthenticatedParent }>();
    if (user.mustChangePassword) throw new ForbiddenException("Password change required before continuing.");
    return true;
  }
}

export const CurrentParent = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedParent => {
  return ctx.switchToHttp().getRequest<Request & { user: AuthenticatedParent }>().user;
});
