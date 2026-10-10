"use client";

import { ContentCard } from "@/components/common/content-card";
import { LoadingState } from "@/components/common/spinner";
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
        <LoadingState label="Checking onboarding…" />
      ) : (
        <OnboardingChecklist steps={data.steps} complete={data.complete} />
      )}
    </ContentCard>
  );
}
