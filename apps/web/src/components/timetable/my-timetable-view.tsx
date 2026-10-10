"use client";

import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { LoadingState } from "@/components/common/spinner";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { printStaffTimetable } from "@/lib/print-timetable";
import { useGetCurrentPeriodQuery } from "@/store/api/academic-api";
import { useAppSelector } from "@/store/hooks";
import { DAY_LABELS, useGetStaffTimetableQuery } from "@/store/api/timetable-api";
import { selectAccessToken } from "@/store/slices/auth-slice";

/** FEATURES.md §8.1 "Free-period view per teacher" — the signed-in teacher's own weekly schedule. */
export function MyTimetableView() {
  const accessToken = useAppSelector(selectAccessToken);
  const claims = accessToken ? decodeAccessToken(accessToken) : null;
  const { data: current } = useGetCurrentPeriodQuery();
  const sessionId = current?.session?.id ?? "";

  const { data, isLoading } = useGetStaffTimetableQuery(
    { sessionId, staffId: claims?.sub ?? "" },
    { skip: !sessionId || !claims?.sub },
  );

  return (
    <PageContainer>
      <PageHeader
        title="My timetable"
        subtitle={current?.term?.name}
        actions={
          data && data.sections.length > 0 ? (
            <AppButton type="button" variant="secondary" onClick={() => printStaffTimetable(claims?.email ?? "", data)}>
              Print
            </AppButton>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !data || data.sections.length === 0 ? (
        <ContentCard>
          <EmptyState
            title="No lessons scheduled yet"
            description="Once a class you teach is added to the timetable, it appears here."
          />
        </ContentCard>
      ) : (
        <div className="flex flex-col gap-5">
          {data.sections.map((section) => (
            <ContentCard key={section.section} flush>
              <h2 className="px-5 pt-5 pb-3 text-base">{section.section}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground border-b text-left text-xs">
                    <tr>
                      <th className="px-4 py-2 font-medium">Period</th>
                      {section.days.map((day) => (
                        <th key={day} className="px-3 py-2 font-medium">
                          {DAY_LABELS[day]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.periods.map((period) => (
                      <tr key={period.id} className="border-b last:border-0">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {period.name}
                          <span className="text-muted-foreground block text-xs">
                            {period.startTime}–{period.endTime}
                          </span>
                        </td>
                        {section.days.map((day) => {
                          if (!period.isTeaching) {
                            return (
                              <td key={day} className="bg-muted text-muted-foreground px-3 py-2.5 text-xs">
                                —
                              </td>
                            );
                          }
                          const slot = section.slots.find((s) => s.dayOfWeek === day && s.periodId === period.id);
                          return (
                            <td key={day} className="px-3 py-2.5">
                              {slot ? (
                                <>
                                  <span className="block font-medium">{slot.classLabel}</span>
                                  <span className="text-muted-foreground block text-xs">{slot.subjectName}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-xs">Free</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ContentCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
