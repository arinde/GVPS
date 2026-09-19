"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PortalShell } from "@/components/portal/portal-shell";

// Public pages: no session, no redirect, no app chrome.
const PUBLIC_PATHS = ["/"];

/**
 * Staff pages and the family portal have separate sessions and chrome, and
 * the school's public pages have neither. This picks by path, so no shell's
 * session restore or redirects ever run on another's pages.
 */
export function ShellSwitch({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  if (pathname.startsWith("/portal")) return <PortalShell>{children}</PortalShell>;
  return <AppShell>{children}</AppShell>;
}
