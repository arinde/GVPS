"use client";

import { Pencil } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { PageContainer } from "@/components/common/page-container";
import { StaffProfileDetails } from "@/components/staff/staff-profile-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetMyProfileQuery } from "@/store/api/staff-api";

/**
 * The signed-in staff member's own record. Read-only: a change to your own
 * details — above all your salary account — goes through the superadmin, so
 * someone who got into this account could not redirect your pay. The
 * superadmin is the exception: they edit their own record the way they edit
 * anyone's, and the change is audited like any other.
 */
export function MyProfileView() {
  const { data: profile, isLoading, isError } = useGetMyProfileQuery();

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-sm" role="status">
          Loading your profile…
        </p>
      </PageContainer>
    );
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <Alert variant="destructive" role="alert">
          <AlertDescription>Your profile could not be loaded. Refresh the page to try again.</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const isSuperadmin = profile.roles.some(({ role }) => role === "SUPERADMIN");

  return (
    <PageContainer width="form">
      <StaffProfileDetails
        profile={profile}
        footnote={
          isSuperadmin
            ? "As superadmin you can edit your own details. Every change is recorded in the audit log."
            : "To change any of these details, ask the superadmin. Staff cannot edit their own record, so no one who gets into your account can redirect your salary."
        }
        actions={
          isSuperadmin ? (
            <AppLinkButton href={`/staff/${profile.id}/edit`} variant="secondary">
              <Pencil aria-hidden="true" />
              Edit my details
            </AppLinkButton>
          ) : undefined
        }
      />
    </PageContainer>
  );
}
