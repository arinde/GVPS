import { createHash, randomBytes } from "node:crypto";
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { StringValue } from "ms";
import type { Role, Staff } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // FEATURES.md §1.2: staff login, with lockout after repeated failures.
  // Email is looked up without a school selector — safe only because
  // PLAN.md §4.1 notes there is a single school today; a real multi-tenant
  // login needs a school selector or subdomain before this can stay correct.
  async login(email: string, password: string): Promise<TokenPair> {
    const staff = await this.prisma.staff.findFirst({ where: { email }, include: { roles: true } });
    if (!staff) throw new UnauthorizedException("Invalid credentials.");

    if (staff.lockedUntil && staff.lockedUntil > new Date()) {
      throw new ForbiddenException("Account locked. Try again later.");
    }

    const passwordValid = await argon2.verify(staff.passwordHash, password);
    if (!passwordValid) {
      await this.registerFailedLogin(staff);
      throw new UnauthorizedException("Invalid credentials.");
    }

    await this.prisma.staff.update({
      where: { id: staff.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const roles = staff.roles.map((r) => r.role);
    return this.issueTokenPair(staff, roles);
  }

  // Rotates the refresh token (old one revoked, new one issued) so a stolen
  // token that gets replayed after the legitimate client refreshes is
  // rejected — the standard mitigation for a bearer token that can't be
  // bound to a single device the way the parent flow's device list is.
  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }

    const staff = await this.prisma.staff.findUniqueOrThrow({
      where: { id: stored.staffId },
      include: { roles: true },
    });

    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const roles = staff.roles.map((r) => r.role);
    return this.issueTokenPair(staff, roles);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(staffId: string, currentPassword: string, newPassword: string): Promise<void> {
    const staff = await this.prisma.staff.findUniqueOrThrow({ where: { id: staffId } });

    const currentValid = await argon2.verify(staff.passwordHash, currentPassword);
    if (!currentValid) throw new UnauthorizedException("Current password is incorrect.");

    const passwordHash = await argon2.hash(newPassword);
    await this.prisma.staff.update({
      where: { id: staffId },
      data: { passwordHash, mustChangePassword: false },
    });

    // A password change is exactly the moment a compromised session should
    // stop being trusted — revoke every other device's refresh token too.
    await this.prisma.refreshToken.updateMany({
      where: { staffId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async registerFailedLogin(staff: Staff): Promise<void> {
    const failedLoginAttempts = staff.failedLoginAttempts + 1;
    const lockedUntil =
      failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000)
        : staff.lockedUntil;

    await this.prisma.staff.update({ where: { id: staff.id }, data: { failedLoginAttempts, lockedUntil } });
  }

  private async issueTokenPair(staff: Staff, roles: Role[]): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      {
        sub: staff.id,
        schoolId: staff.schoolId,
        email: staff.email,
        roles,
        mustChangePassword: staff.mustChangePassword,
      },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        // `ms`'s StringValue type can't be verified at compile time against
        // an arbitrary env string — the format (e.g. "15m") is validated at
        // runtime by the jsonwebtoken library itself, which throws on a bad value.
        expiresIn: (this.config.get<string>("JWT_ACCESS_TTL") ?? "15m") as StringValue,
      },
    );

    const refreshTtlDays = Number(this.config.get<string>("JWT_REFRESH_TTL_DAYS") ?? "30");
    const rawRefreshToken = randomBytes(32).toString("base64url");
    await this.prisma.refreshToken.create({
      data: {
        staffId: staff.id,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + refreshTtlDays * 24 * 60 * 60_000),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken, mustChangePassword: staff.mustChangePassword };
  }
}

// Refresh tokens are high-entropy random bytes, not user secrets — a fast
// hash is enough to keep the DB from holding usable bearer tokens in plain
// text (unlike passwords, brute-forcing the hash isn't the threat model).
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
