"use client";

import { PageContainer } from "@/components/common/page-container";
import { StaffProfileDetails } from "@/components/staff/staff-profile-details";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetStaffProfileQuery } from "@/store/api/staff-api";

/** The superadmin's view of one colleague's record. */
export function StaffProfileView({ staffId }: { staffId: string }) {
  const { data: profile, isLoading, isError } = useGetStaffProfileQuery(staffId);

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-sm" role="status">
          Loading…
        </p>
      </PageContainer>
    );
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            This staff member could not be found, or only the superadmin can view them.
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="form">
      <StaffProfileDetails
        profile={profile}
        footnote="Only the superadmin and this staff member can see this record. Classes are changed under Class allocation."
      />
    </PageContainer>
  );
}
