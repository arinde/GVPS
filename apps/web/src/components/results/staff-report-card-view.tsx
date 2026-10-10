"use client";

import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { ReportCardView } from "@/components/results/report-card-view";
import { TRAIT_LABELS } from "@/lib/traits";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useGetReportCardQuery } from "@/store/api/report-card-api";

export type StaffReportCardViewProps = { termId: string; studentId: string };

/** The report card a staff member is allowed to read (FEATURES.md §14 "Report cards"), with a print action. */
export function StaffReportCardView({ termId, studentId }: StaffReportCardViewProps) {
  const { data: card, isLoading, isError } = useGetReportCardQuery({ termId, studentId });
  const { data: access } = useGetMyAccessQuery();

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading report card…
      </p>
    );
  }
  if (isError || !card) {
    return (
      <ContentCard>
        <EmptyState
          title="No report card yet"
          description="This report card appears here once the class has been published."
        />
      </ContentCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end print:hidden">
        <AppButton type="button" variant="secondary" onClick={() => window.print()}>
          Print report card
        </AppButton>
      </div>
      <ReportCardView card={card} schoolName={access?.school.name ?? ""} traitLabels={TRAIT_LABELS} />
    </div>
  );
}
