"use client";

import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { useGetPortalChildTimetableQuery } from "@/store/api/portal-api";
import { DAY_LABELS } from "@/store/api/timetable-api";

export type PortalChildTimetableProps = { studentId: string };

/** FEATURES.md §12: a parent's read-only view of their ward's class timetable. */
export function PortalChildTimetable({ studentId }: PortalChildTimetableProps) {
  const { data: grid, isLoading } = useGetPortalChildTimetableQuery(studentId);

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading timetable…
      </p>
    );
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
      <h2 className="px-5 pt-5 pb-3 text-base">Timetable — {grid.classLabel}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b text-left text-xs">
            <tr>
              <th className="px-4 py-2 font-medium">Period</th>
              {grid.days.map((day) => (
                <th key={day} className="px-3 py-2 font-medium">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.periods.map((period) => (
              <tr key={period.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {period.name}
                  <span className="text-muted-foreground block text-xs">
                    {period.startTime}–{period.endTime}
                  </span>
                </td>
                {grid.days.map((day) => {
                  if (!period.isTeaching) {
                    return (
                      <td key={day} className="bg-muted text-muted-foreground px-3 py-2.5 text-xs">
                        —
                      </td>
                    );
                  }
                  const slot = grid.slots.find((s) => s.dayOfWeek === day && s.periodId === period.id);
                  return (
                    <td key={day} className="px-3 py-2.5">
                      {slot ? <span className="font-medium">{slot.subjectName}</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentCard>
  );
}
