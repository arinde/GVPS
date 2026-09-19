"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { primaryRoleLabel } from "@/components/auth/roles";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { MobileTabBar, MobileTopBar } from "@/components/layout/mobile-nav";
import { activeNavItem, visibleNavItems } from "@/components/layout/nav-items";
import { authRedirect } from "@/lib/auth-redirect";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { notify } from "@/lib/notify";
import { staffName } from "@/lib/staff-name";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useGetCurrentPeriodQuery } from "@/store/api/academic-api";
import { useLogoutMutation, useRefreshSessionQuery } from "@/store/api/auth-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCredentials, selectAccessToken, selectMustChangePassword } from "@/store/slices/auth-slice";

// Pages that render without the app chrome: you are either signing in, or
// being made to replace a temporary password first (FEATURES.md §1.2).
const BARE_ROUTES = ["/login", "/change-password"];

// Four tab-bar items fit a phone's width (STITCH-GLOBAL.md §12).
const MOBILE_TABS = 4;

/**
 * Wraps every page in the app chrome — sidebar and top bar on desktop, top
 * bar and bottom tabs on a phone — and sends visitors where they belong:
 * signed out to /login, temporary passwords to /change-password.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const mustChangePassword = useAppSelector(selectMustChangePassword);

  // Restores the session from the httpOnly refresh cookie on each page load.
  // The auth slice stores the token in the same action that ends the request
  // (auth-slice.ts), so "finished" and "signed in" can never disagree here.
  const { isLoading: isRestoringSession } = useRefreshSessionQuery();
  const [logout, { isLoading: isSigningOut }] = useLogoutMutation();
  const { data: period } = useGetCurrentPeriodQuery(undefined, { skip: !accessToken });
  const { data: me } = useGetMyAccessQuery(undefined, { skip: !accessToken });

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

  const items = visibleNavItems(claims.roles);
  const active = activeNavItem(items, pathname);
  const schoolName = me?.school.name ?? "";
  const person = me ? staffName(me.staff) : claims.email;
  const context = period?.session
    ? `${period.session.name}${period.term ? ` · ${period.term.name}` : ""}`
    : "No current session is set";

  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar items={items} activeHref={active?.href ?? null} schoolName={schoolName} />

      <div className="flex min-h-full min-w-0 flex-1 flex-col lg:pl-[241px]">
        <AppTopBar
          context={context}
          signedInAs={`${person} · ${primaryRoleLabel(claims.roles)}`}
          onSignOut={signOut}
          isSigningOut={isSigningOut}
        />
        <MobileTopBar title={active?.label ?? schoolName} onSignOut={signOut} isSigningOut={isSigningOut} />

        {/* Bottom padding on phones keeps content clear of the tab bar. */}
        <main className="flex flex-1 flex-col pb-[60px] lg:pb-0">{children}</main>
      </div>

      <MobileTabBar items={items.slice(0, MOBILE_TABS)} activeHref={active?.href ?? null} />
    </div>
  );
}
