"use client";

import { Pencil } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { PageContainer } from "@/components/common/page-container";
import { StaffProfileDetails } from "@/components/staff/staff-profile-details";
import { StaffAccountActions } from "@/components/staff/staff-account-actions";
import { StaffOnboardingCard } from "@/components/staff/staff-onboarding-card";
import { SubjectTeachingCard } from "@/components/staff/subject-teaching-card";
import { staffName } from "@/lib/staff-name";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useGetStaffProfileQuery } from "@/store/api/staff-api";

/** The superadmin's view of one colleague's record. */
export function StaffProfileView({ staffId }: { staffId: string }) {
  const { data: profile, isLoading, isError } = useGetStaffProfileQuery(staffId);
  const { data: access } = useGetMyAccessQuery();

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

  const teaches = profile.roles.some(({ role }) => role === "SUBJECT_TEACHER" || role === "FORM_TEACHER");

  return (
    <PageContainer width="form">
      <StaffProfileDetails
        profile={profile}
        footnote="Only the superadmin and this staff member can see this record. Every change is recorded in the audit log. Classes are changed under Class allocation."
        actions={
          <AppLinkButton href={`/staff/${staffId}/edit`} variant="secondary">
            <Pencil aria-hidden="true" />
            Edit details
          </AppLinkButton>
        }
      />
      <div className="mt-5 flex flex-col gap-5">
        <StaffOnboardingCard staffId={profile.id} />
        {/* Only teachers are given subjects; the API refuses anyone else. */}
        {teaches ? <SubjectTeachingCard staffId={profile.id} name={staffName(profile)} /> : null}
        <StaffAccountActions
          staffId={profile.id}
          name={staffName(profile)}
          email={profile.email}
          schoolName={access?.school.name ?? ""}
        />
      </div>
    </PageContainer>
  );
}
