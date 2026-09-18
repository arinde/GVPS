"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import { visibleNavItems } from "@/components/layout/nav-items";
import { authRedirect } from "@/lib/auth-redirect";
import { notify } from "@/lib/notify";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { useGetCurrentPeriodQuery } from "@/store/api/academic-api";
import { useLogoutMutation, useRefreshSessionQuery } from "@/store/api/auth-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCredentials, selectAccessToken, selectMustChangePassword } from "@/store/slices/auth-slice";

// Pages that render without the navigation: you are either signing in, or
// being made to replace a temporary password first (FEATURES.md §1.2).
const BARE_ROUTES = ["/login", "/change-password"];

/**
 * Wraps every page in the app chrome and sends visitors where they belong —
 * signed out to /login, temporary passwords to /change-password. Hands plain
 * props to AppNav (AGENTS.md §1).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const mustChangePassword = useAppSelector(selectMustChangePassword);

  // Same query AuthBootstrap runs; RTK Query dedupes it, so this only reads
  // whether the cookie-based restore has finished.
  const { isLoading: isRestoringSession } = useRefreshSessionQuery();
  const [logout, { isLoading: isSigningOut }] = useLogoutMutation();
  const { data: period } = useGetCurrentPeriodQuery(undefined, { skip: !accessToken });

  const claims = accessToken ? decodeAccessToken(accessToken) : null;
  const redirectTo = authRedirect({
    pathname,
    isRestoringSession,
    isSignedIn: claims !== null,
    mustChangePassword,
  });

  // Synchronises with the browser's history, which lives outside React. The
  // App Router has no declarative redirect for a decision that depends on a
  // client-side session, so this is the one place navigation is imperative.
  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  // Render nothing protected while restoring or mid-redirect, so a signed-out
  // visitor never glimpses a page before being moved.
  if (isRestoringSession || redirectTo) {
    return (
      <p className="text-muted-foreground m-auto text-sm" role="status">
        Loading…
      </p>
    );
  }

  const bare = BARE_ROUTES.some((route) => pathname.startsWith(route));
  if (bare || !claims) return <>{children}</>;

  async function signOut() {
    try {
      await logout().unwrap();
    } finally {
      // Clear locally even if the network call failed — appearing signed in
      // on a shared office machine is the worse outcome.
      dispatch(clearCredentials());
      notify.info("Signed out");
      router.replace("/login");
    }
  }

  const periodLabel = period?.session
    ? `${period.session.name}${period.term ? ` · ${period.term.name}` : ""}`
    : undefined;

  return (
    <>
      <AppNav
        items={visibleNavItems(claims.roles)}
        currentPath={pathname}
        email={claims.email}
        periodLabel={periodLabel}
        onSignOut={signOut}
        isSigningOut={isSigningOut}
      />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
