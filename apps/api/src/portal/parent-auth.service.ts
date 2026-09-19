import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import type { StringValue } from "ms";
import type { ParentAccount } from "@prisma/client";
import { hashToken, newRefreshToken, TOKEN_AUDIENCE } from "@/common/secrets";
import type { ParentTokenPayload } from "@/portal/parent-auth.primitives";
import { PrismaService } from "@/prisma/prisma.service";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
// FEATURES.md §1.3: a parent signs in a few times a year, not per visit.
const REFRESH_TTL_DAYS = 90;

export type ParentTokenPair = { accessToken: string; refreshToken: string; mustChangePassword: boolean };

// One message for an unknown number and a wrong password, so the login form
// cannot be used to find out which numbers have accounts.
const invalid = () => new UnauthorizedException("That phone number and password do not match.");

/**
 * Family-portal sign-in: phone number and password, lockout after repeated
 * failures, rotating refresh tokens — the staff design (auth.service.ts), on
 * separate tables and a separate token audience.
 */
@Injectable()
export class ParentAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Single school today (PLAN.md §4.1), so the number alone finds the account.
  async login(phone: string, password: string): Promise<ParentTokenPair> {
    const account = await this.prisma.parentAccount.findFirst({ where: { phone } });
    if (!account) throw invalid();
    if (account.lockedUntil && account.lockedUntil > new Date()) {
      throw new ForbiddenException("Too many wrong attempts. Try again in 15 minutes.");
    }

    if (!(await argon2.verify(account.passwordHash, password))) {
      const failedLoginAttempts = account.failedLoginAttempts + 1;
      const lockedUntil =
        failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000)
          : account.lockedUntil;
      await this.prisma.parentAccount.update({ where: { id: account.id }, data: { failedLoginAttempts, lockedUntil } });
      throw invalid();
    }

    const updated = await this.prisma.parentAccount.update({
      where: { id: account.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    return this.issueTokens(updated);
  }

  async refresh(rawRefreshToken: string): Promise<ParentTokenPair> {
    const stored = await this.prisma.parentRefreshToken.findUnique({
      where: { tokenHash: hashToken(rawRefreshToken) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Your session has ended. Please sign in again.");
    }
    await this.prisma.parentRefreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const account = await this.prisma.parentAccount.findUniqueOrThrow({ where: { id: stored.parentAccountId } });
    return this.issueTokens(account);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.prisma.parentRefreshToken.updateMany({
      where: { tokenHash: hashToken(rawRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(accountId: string, currentPassword: string, newPassword: string): Promise<void> {
    const account = await this.prisma.parentAccount.findUniqueOrThrow({ where: { id: accountId } });
    if (!(await argon2.verify(account.passwordHash, currentPassword))) {
      throw new UnauthorizedException("Current password is incorrect.");
    }
    await this.prisma.parentAccount.update({
      where: { id: accountId },
      data: { passwordHash: await argon2.hash(newPassword), mustChangePassword: false },
    });
    // Every other device is signed out: a changed password should end any session someone else holds.
    await this.prisma.parentRefreshToken.updateMany({
      where: { parentAccountId: accountId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(account: ParentAccount): Promise<ParentTokenPair> {
    const payload: ParentTokenPayload = {
      sub: account.id,
      schoolId: account.schoolId,
      phone: account.phone,
      mustChangePassword: account.mustChangePassword,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      audience: TOKEN_AUDIENCE.parent,
      expiresIn: (this.config.get<string>("JWT_ACCESS_TTL") ?? "15m") as StringValue,
    });

    const refreshToken = newRefreshToken();
    await this.prisma.parentRefreshToken.create({
      data: {
        parentAccountId: account.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60_000),
      },
    });
    return { accessToken, refreshToken, mustChangePassword: account.mustChangePassword };
  }
}
