"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { crestInitials } from "@/components/layout/app-sidebar";
import { authRedirect, PORTAL_ROUTES } from "@/lib/auth-redirect";
import { notify } from "@/lib/notify";
import { useGetPortalMeQuery, usePortalLogoutMutation, usePortalRefreshSessionQuery } from "@/store/api/portal-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearPortalCredentials } from "@/store/slices/portal-auth-actions";
import { selectPortalAccessToken, selectPortalMustChangePassword } from "@/store/slices/portal-auth-slice";

const BARE_ROUTES = [PORTAL_ROUTES.login, PORTAL_ROUTES.changePassword];

/**
 * The family portal's frame: one top bar with the school's name and a sign
 * out, then the page. No sidebar — a parent has two or three screens, not a
 * menu. Sends signed-out visitors to the portal sign-in and temporary
 * passwords to the password change, as AppShell does for staff.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectPortalAccessToken);
  const mustChangePassword = useAppSelector(selectPortalMustChangePassword);
  const { isLoading: isRestoringSession } = usePortalRefreshSessionQuery();
  const { data: me } = useGetPortalMeQuery(undefined, { skip: !accessToken || mustChangePassword });
  const [logout, { isLoading: isSigningOut }] = usePortalLogoutMutation();

  const redirectTo = authRedirect({
    pathname,
    isRestoringSession,
    isSignedIn: accessToken !== null,
    mustChangePassword,
    routes: PORTAL_ROUTES,
  });

  // Synchronises with the browser's history: the redirect depends on a
  // client-side session, which the App Router cannot express declaratively.
  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (isRestoringSession || redirectTo) {
    return (
      <p className="text-muted-foreground m-auto text-sm" role="status">
        Loading…
      </p>
    );
  }

  if (BARE_ROUTES.some((route) => pathname.startsWith(route)) || !accessToken) return <>{children}</>;

  async function signOut() {
    try {
      await logout().unwrap();
    } finally {
      // Cleared even if the call failed: a family phone is often shared.
      dispatch(clearPortalCredentials());
      notify.info("Signed out");
      router.replace(PORTAL_ROUTES.login);
    }
  }

  const schoolName = me?.school.name ?? "";

  return (
    <div className="bg-canvas flex min-h-full flex-1 flex-col">
      <header className="bg-navy flex h-16 items-center gap-3 px-4 text-[#FCFAFA] sm:px-8">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/40 text-xs font-bold"
        >
          {crestInitials(schoolName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{schoolName || "School"} · Family portal</p>
          {me ? <p className="truncate text-xs opacity-80">Signed in as {me.names[0] ?? me.phone}</p> : null}
        </div>
        <AppButton variant="secondary" size="small" onClick={signOut} disabled={isSigningOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </AppButton>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
