"use client";

import { ContentCard } from "@/components/common/content-card";
import { OnboardingChecklist } from "@/components/staff/onboarding-checklist";
import { useGetStaffOnboardingQuery } from "@/store/api/staff-lifecycle-api";

export type StaffOnboardingCardProps = { staffId: string };

/** Container: shows where a teacher is in onboarding, and updates as roles and assignments are made. */
export function StaffOnboardingCard({ staffId }: StaffOnboardingCardProps) {
  const { data, isLoading } = useGetStaffOnboardingQuery(staffId);

  return (
    <ContentCard>
      <h2 className="mb-3 text-base">Onboarding</h2>
      {isLoading || !data ? (
        <p className="text-muted-foreground text-sm" role="status">
          Checking onboarding…
        </p>
      ) : (
        <OnboardingChecklist steps={data.steps} complete={data.complete} />
      )}
    </ContentCard>
  );
}
