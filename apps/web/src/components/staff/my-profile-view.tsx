"use client";

import { PageContainer } from "@/components/common/page-container";
import { StaffProfileDetails } from "@/components/staff/staff-profile-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetMyProfileQuery } from "@/store/api/staff-api";

/**
 * The signed-in staff member's own record. Read-only: a change to your own
 * details — above all your salary account — goes through the superadmin, so
 * someone who got into this account could not redirect your pay.
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

  return (
    <PageContainer width="form">
      <StaffProfileDetails
        profile={profile}
        footnote="To change any of these details, ask the superadmin. Staff cannot edit their own record, so no one who gets into your account can redirect your salary."
      />
    </PageContainer>
  );
}
