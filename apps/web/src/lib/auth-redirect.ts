export type AuthRedirectInput = {
  pathname: string;
  /** True while the boot-time refresh from the httpOnly cookie is in flight. */
  isRestoringSession: boolean;
  isSignedIn: boolean;
  mustChangePassword: boolean;
};

/**
 * Where the current visitor should be sent, or null to stay put.
 *
 * Returns null while the session is still being restored — deciding before
 * then would bounce a signed-in user to /login on every page refresh, because
 * the access token only exists in memory and has to be re-fetched from the
 * refresh cookie first.
 *
 * Presentation only: the API rejects unauthenticated requests regardless
 * (FEATURES.md §1.5). This just stops people landing on a screen with no way
 * forward.
 */
export function authRedirect({
  pathname,
  isRestoringSession,
  isSignedIn,
  mustChangePassword,
}: AuthRedirectInput): string | null {
  if (isRestoringSession) return null;

  const onLogin = pathname.startsWith("/login");
  const onChangePassword = pathname.startsWith("/change-password");

  if (!isSignedIn) return onLogin ? null : "/login";

  // FEATURES.md §1.2: a temporary password must be replaced before anything
  // else, so every other route funnels here until it is.
  if (mustChangePassword) return onChangePassword ? null : "/change-password";

  // Already signed in: the login page has nothing to offer.
  if (onLogin) return "/";

  return null;
}
