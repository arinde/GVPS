import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Role } from "@prisma/client";
import { TOKEN_AUDIENCE } from "@/common/secrets";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

export type AccessTokenPayload = {
  sub: string;
  schoolId: string;
  email: string;
  roles: Role[];
  mustChangePassword: boolean;
};

// Roles/mustChangePassword ride along in the access token rather than being
// re-read from the DB on every request. It's stale for at most the access
// token's TTL (short-lived by design) — refresh re-fetches from Staff and
// re-mints the token, so a role change or password change takes effect
// within one refresh cycle, not immediately. That's the tradeoff a
// stateless access token makes; the refresh token is what's revocable.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      // Staff tokens only: a parent-portal token is signed with the same
      // secret and must be refused here (common/secrets.ts).
      audience: TOKEN_AUDIENCE.staff,
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedStaff {
    return {
      id: payload.sub,
      schoolId: payload.schoolId,
      email: payload.email,
      roles: payload.roles,
      mustChangePassword: payload.mustChangePassword,
    };
  }
}
