"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import { visibleNavItems } from "@/components/layout/nav-items";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { useGetCurrentPeriodQuery } from "@/store/api/academic-api";
import { useLogoutMutation } from "@/store/api/auth-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearCredentials, selectAccessToken, selectMustChangePassword } from "@/store/slices/auth-slice";

// Pages that must not show navigation: you are either not signed in, or you
// are being made to change a temporary password before going anywhere else
// (FEATURES.md §1.2).
const BARE_ROUTES = ["/login", "/change-password"];

/**
 * Wraps every page in the app chrome. Reads auth and the current period, then
 * hands plain props to AppNav (AGENTS.md §1).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const accessToken = useAppSelector(selectAccessToken);
  const mustChangePassword = useAppSelector(selectMustChangePassword);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [logout, { isLoading: isSigningOut }] = useLogoutMutation();
  const claims = accessToken ? decodeAccessToken(accessToken) : null;

  // Only ask for the period once there is a session to ask with, otherwise
  // every signed-out page load fires a 401.
  const { data: period } = useGetCurrentPeriodQuery(undefined, { skip: !accessToken });

  const bare = BARE_ROUTES.some((route) => pathname.startsWith(route));
  if (bare || !claims || mustChangePassword) {
    return <>{children}</>;
  }

  async function signOut() {
    try {
      await logout().unwrap();
    } finally {
      // Clear locally even if the network call failed — leaving someone
      // apparently signed in on a shared office machine is the worse outcome.
      dispatch(clearCredentials());
      router.push("/login");
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
