"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PortalShell } from "@/components/portal/portal-shell";

/**
 * Staff pages and the family portal have separate sessions and chrome. This
 * picks one by path, so neither shell's session restore or redirects ever
 * run on the other's pages.
 */
export function ShellSwitch({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/portal")) return <PortalShell>{children}</PortalShell>;
  return <AppShell>{children}</AppShell>;
}
