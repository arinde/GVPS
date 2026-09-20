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
import { AuthService } from "@/auth/auth.service";
import { ChangePasswordSchema, type ChangePasswordDto } from "@/auth/schemas/change-password.schema";
import { LoginSchema, type LoginDto } from "@/auth/schemas/login.schema";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { SkipPasswordChangeCheck } from "@/common/decorators/skip-password-change-check.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import { clearCookieOptions, refreshCookieOptions } from "@/common/refresh-cookie";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/auth";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.login(body.email, body.password);
    setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, mustChangePassword: tokens.mustChangePassword };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = readRefreshCookie(req);
    if (!rawRefreshToken) throw new UnauthorizedException("No refresh token provided.");

    const tokens = await this.auth.refresh(rawRefreshToken);
    setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken, mustChangePassword: tokens.mustChangePassword };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = readRefreshCookie(req);
    if (rawRefreshToken) await this.auth.logout(rawRefreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, clearCookieOptions(REFRESH_COOKIE_PATH));
  }

  @Post("change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @SkipPasswordChangeCheck()
  async changePassword(
    @CurrentUser() user: AuthenticatedStaff,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: ChangePasswordDto,
  ) {
    await this.auth.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions(REFRESH_COOKIE_PATH));
}

function readRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[REFRESH_COOKIE_NAME];
}
