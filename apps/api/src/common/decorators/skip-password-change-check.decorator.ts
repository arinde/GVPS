import { SetMetadata } from "@nestjs/common";

export const SKIP_PASSWORD_CHANGE_CHECK_KEY = "skipPasswordChangeCheck";

/**
 * FEATURES.md §1.2: password change is forced on first login. JwtAuthGuard
 * blocks every route for a staff member with mustChangePassword set, except
 * the ones carrying this decorator (change-password itself, and logout).
 */
export const SkipPasswordChangeCheck = () => SetMetadata(SKIP_PASSWORD_CHANGE_CHECK_KEY, true);
