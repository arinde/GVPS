"use client";

import { BarChartCard } from "@/components/analytics/bar-chart-card";
import { LineChartCard } from "@/components/analytics/line-chart-card";
import { PieChartCard } from "@/components/analytics/pie-chart-card";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/spinner";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { formatKobo } from "@/lib/money";
import {
  useGetAcademicAnalyticsQuery,
  useGetAttendanceAnalyticsQuery,
  useGetEnrolmentAnalyticsQuery,
  useGetFinancialAnalyticsQuery,
} from "@/store/api/analytics-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

// Mirrors the backend's own reader lists (analytics/analytics.service.ts) — skipping the
// call for a role that can't see a card avoids a pointless 403 round trip.
const ACADEMIC_READERS = ["SUPERADMIN", "PRINCIPAL"];
const FINANCIAL_READERS = ["SUPERADMIN", "PRINCIPAL", "BURSAR"];

/** FEATURES.md §10 — the school's numbers as charts instead of raw lists. Each card is independent: one failing or being out of a role's reach never blocks the rest. */
export function AnalyticsView() {
  const accessToken = useAppSelector(selectAccessToken);
  const roles = decodeAccessToken(accessToken ?? "")?.roles ?? [];
  const canSeeAcademic = roles.some((role) => ACADEMIC_READERS.includes(role));
  const canSeeFinancial = roles.some((role) => FINANCIAL_READERS.includes(role));

  const { data: enrolment, isLoading: loadingEnrolment } = useGetEnrolmentAnalyticsQuery(undefined, {
    skip: !canSeeAcademic,
  });
  const { data: academic, isLoading: loadingAcademic } = useGetAcademicAnalyticsQuery(undefined, {
    skip: !canSeeAcademic,
  });
  const { data: attendance, isLoading: loadingAttendance } = useGetAttendanceAnalyticsQuery(undefined, {
    skip: !canSeeAcademic,
  });
  const { data: financial, isLoading: loadingFinancial } = useGetFinancialAnalyticsQuery(undefined, {
    skip: !canSeeFinancial,
  });

  if (!canSeeAcademic && !canSeeFinancial) {
    return (
      <PageContainer>
        <PageHeader title="Analytics" />
        <ContentCard>
          <EmptyState
            title="No analytics for this role"
            description="Analytics is for the superadmin, principal and bursar."
          />
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Analytics" subtitle={enrolment?.session ?? academic?.term ?? financial?.term} />

      <div className="flex flex-col gap-5">
        {canSeeFinancial ? (
          loadingFinancial || !financial ? (
            <LoadingState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Expected this term" value={formatKobo(financial.expectedKobo)} wash="lavender" />
              <StatCard label="Collected this term" value={formatKobo(financial.collectedKobo)} wash="yellow" />
              <StatCard label="Outstanding" value={formatKobo(financial.outstandingKobo)} wash="lavender" />
            </div>
          )
        ) : null}

        {canSeeAcademic ? (
          <>
            {loadingEnrolment || !enrolment ? (
              <LoadingState />
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  <BarChartCard
                    title="Enrolment by level"
                    subtitle={`${enrolment.total} students, ${enrolment.session}`}
                    data={enrolment.byLevel}
                    categoryKey="name"
                    valueKey="count"
                    valueLabel="Students"
                  />
                  <PieChartCard
                    title="Enrolment by sex"
                    subtitle={enrolment.session}
                    data={enrolment.bySex.map((row) => ({ name: row.sex, value: row.count }))}
                  />
                </div>
                <BarChartCard
                  title="Students per class"
                  subtitle={enrolment.session}
                  data={enrolment.byArm}
                  categoryKey="name"
                  valueKey="count"
                  valueLabel="Students"
                />
              </>
            )}

            {loadingAcademic || !academic ? (
              <LoadingState />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <BarChartCard
                  title="Average score by subject"
                  subtitle={academic.term}
                  data={academic.bySubject}
                  categoryKey="name"
                  valueKey="averagePercent"
                  valueLabel="Average %"
                  formatValue={(value) => `${value}%`}
                />
                <PieChartCard
                  title="Grade distribution"
                  subtitle={academic.term}
                  data={academic.gradeDistribution.map((row) => ({ name: row.letter, value: row.count }))}
                />
              </div>
            )}

            {loadingAttendance || !attendance ? (
              <LoadingState />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <LineChartCard
                  title="Attendance rate, last 14 days"
                  subtitle="Whole school"
                  data={attendance.daily}
                  categoryKey="date"
                  valueKey="percentPresent"
                  valueLabel="% present"
                  formatValue={(value) => `${value}%`}
                />
                <BarChartCard
                  title="Attendance rate by class"
                  subtitle={attendance.term}
                  data={attendance.byArm}
                  categoryKey="name"
                  valueKey="percentPresent"
                  valueLabel="% present"
                  formatValue={(value) => `${value}%`}
                />
              </div>
            )}
          </>
        ) : null}
      </div>
    </PageContainer>
  );
}
