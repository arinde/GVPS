/** Where an area's sign-in, password-change and home pages live. */
export type AuthRoutes = { login: string; changePassword: string; home: string };

export const STAFF_ROUTES: AuthRoutes = { login: "/login", changePassword: "/change-password", home: "/dashboard" };
export const PORTAL_ROUTES: AuthRoutes = {
  login: "/portal/login",
  changePassword: "/portal/change-password",
  home: "/portal",
};

export type AuthRedirectInput = {
  pathname: string;
  /** True while the boot-time refresh from the httpOnly cookie is in flight. */
  isRestoringSession: boolean;
  isSignedIn: boolean;
  mustChangePassword: boolean;
  /** The staff app's pages unless given; the family portal passes its own. */
  routes?: AuthRoutes;
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
  routes = STAFF_ROUTES,
}: AuthRedirectInput): string | null {
  if (isRestoringSession) return null;

  const onLogin = pathname.startsWith(routes.login);
  const onChangePassword = pathname.startsWith(routes.changePassword);

  if (!isSignedIn) return onLogin ? null : routes.login;

  // FEATURES.md §1.2: a temporary password must be replaced before anything
  // else, so every other route funnels here until it is.
  if (mustChangePassword) return onChangePassword ? null : routes.changePassword;

  // Already signed in: the login page has nothing to offer.
  if (onLogin) return routes.home;

  return null;
}
