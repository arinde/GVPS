"use client";

import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/spinner";
import { TimetableLegend } from "@/components/timetable/timetable-legend";
import { WeeklyTimetableGrid } from "@/components/timetable/weekly-timetable-grid";
import { WeeklyTimetableMobile } from "@/components/timetable/weekly-timetable-mobile";
import { useGetPortalChildTimetableQuery } from "@/store/api/portal-api";

export type PortalChildTimetableProps = { studentId: string };

/** FEATURES.md §12: a parent's read-only view of their ward's class timetable. */
export function PortalChildTimetable({ studentId }: PortalChildTimetableProps) {
  const { data: grid, isLoading } = useGetPortalChildTimetableQuery(studentId);

  if (isLoading) {
    return <LoadingState label="Loading timetable…" />;
  }
  if (!grid || grid.periods.length === 0) {
    return (
      <ContentCard>
        <EmptyState title="No timetable yet" description="The school hasn't published this class's timetable yet." />
      </ContentCard>
    );
  }

  return (
    <ContentCard flush>
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 pb-3">
        <h2 className="text-base">Timetable — {grid.classLabel}</h2>
        <TimetableLegend />
      </div>
      <WeeklyTimetableGrid grid={grid} />
      <div className="px-5 pb-5">
        <WeeklyTimetableMobile grid={grid} />
      </div>
    </ContentCard>
  );
}
