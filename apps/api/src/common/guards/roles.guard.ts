import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Role } from "@prisma/client";
import { ROLES_KEY } from "@/common/decorators/roles.decorator";
import type { AuthenticatedStaff } from "@/common/types/authenticated-staff";

/**
 * Coarse role membership only (FEATURES.md §1.1's "core capability" column).
 * Scoping a role down to "their arm" or "their subject" is each domain
 * module's own guard, resolved against teacher_assignments/enrolments
 * (FEATURES.md §1.5) — this guard doesn't have access to that data.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<Request & { user: AuthenticatedStaff }>();
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
