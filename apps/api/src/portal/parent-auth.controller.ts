import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ChangePasswordSchema, type ChangePasswordDto } from "@/auth/schemas/change-password.schema";
import { SkipPasswordChangeCheck } from "@/common/decorators/skip-password-change-check.decorator";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import { clearCookieOptions, refreshCookieOptions } from "@/common/refresh-cookie";
import { ParentAuthService } from "@/portal/parent-auth.service";
import { CurrentParent, ParentAuthGuard, type AuthenticatedParent } from "@/portal/parent-auth.primitives";
import { ParentLoginSchema, type ParentLoginDto } from "@/portal/portal.schemas";

// Its own cookie name and path, so a staff session and a parent session on
// the same browser never overwrite or read each other's refresh token.
const COOKIE_NAME = "parentRefreshToken";
const COOKIE_PATH = "/portal/auth";

@Controller("portal/auth")
export class ParentAuthController {
  constructor(private readonly auth: ParentAuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(ParentLoginSchema)) body: ParentLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.login(body.phone, body.password);
    setCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, mustChangePassword: tokens.mustChangePassword };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = readCookie(req);
    if (!raw) throw new UnauthorizedException("No session.");
    const tokens = await this.auth.refresh(raw);
    setCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, mustChangePassword: tokens.mustChangePassword };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = readCookie(req);
    if (raw) await this.auth.logout(raw);
    res.clearCookie(COOKIE_NAME, clearCookieOptions(COOKIE_PATH));
  }

  @Post("change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ParentAuthGuard)
  @SkipPasswordChangeCheck()
  async changePassword(
    @CurrentParent() parent: AuthenticatedParent,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: ChangePasswordDto,
  ) {
    await this.auth.changePassword(parent.id, body.currentPassword, body.newPassword);
  }
}

function setCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, refreshCookieOptions(COOKIE_PATH));
}

function readCookie(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[COOKIE_NAME];
}
