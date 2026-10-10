"use client";

import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/spinner";
import { ReportCardView } from "@/components/results/report-card-view";
import { TRAIT_LABELS } from "@/lib/traits";
import { useGetPortalChildReportCardQuery, useGetPortalMeQuery } from "@/store/api/portal-api";

export type PortalChildReportCardProps = { studentId: string };

/** FEATURES.md §12: a parent's read-only view of their ward's latest published report card. */
export function PortalChildReportCard({ studentId }: PortalChildReportCardProps) {
  const { data: card, isLoading } = useGetPortalChildReportCardQuery(studentId);
  const { data: me } = useGetPortalMeQuery();

  if (isLoading) {
    return <LoadingState label="Loading report card…" />;
  }
  if (!card) {
    return (
      <ContentCard>
        <EmptyState
          title="No report card yet"
          description="The school publishes report cards once each class has been approved."
        />
      </ContentCard>
    );
  }

  return <ReportCardView card={card} schoolName={me?.school.name ?? ""} traitLabels={TRAIT_LABELS} />;
}
