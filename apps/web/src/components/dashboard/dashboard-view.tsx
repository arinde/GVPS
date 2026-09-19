"use client";

import { AdminDashboardView } from "@/components/dashboard/admin-dashboard-view";
import { QuickLinksDashboard } from "@/components/dashboard/quick-links-dashboard";
import { greeting } from "@/lib/dates";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

// Mirrors the API guard on GET /dashboard; the API refuses anyone else anyway.
const LEADERSHIP = ["SUPERADMIN", "PRINCIPAL"];

/** Picks the home page for the signed-in person's role. */
export function DashboardView() {
  const accessToken = useAppSelector(selectAccessToken);
  const { data: me } = useGetMyAccessQuery(undefined, { skip: !accessToken });
  const roles = (accessToken ? decodeAccessToken(accessToken)?.roles : undefined) ?? [];
  const firstName = me?.staff.firstName ?? null;

  // The app shell holds the page until the session is restored, so the token
  // is present here; this only guards the first render.
  if (!accessToken) return null;

  if (roles.some((role) => LEADERSHIP.includes(role))) return <AdminDashboardView firstName={firstName} />;

  return (
    <QuickLinksDashboard
      greeting={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
      canRegister={me?.canRegister ?? false}
    />
  );
}
