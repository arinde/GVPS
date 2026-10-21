"use client";

import { BarChartCard } from "@/components/common/bar-chart-card";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { LineChartCard } from "@/components/common/line-chart-card";
import { LoadingState } from "@/components/common/spinner";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { PieChartCard } from "@/components/common/pie-chart-card";
import { ServiceStatusCard } from "@/components/system-health/service-status-card";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { useGetSystemHealthHistoryQuery, useGetSystemHealthStatusQuery } from "@/store/api/system-health-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";

const HISTORY_WINDOW_DAYS = 7;

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** FEATURES.md §11 — infrastructure health, separate from Analytics' school data. Superadmin only. */
export function SystemHealthView() {
  const accessToken = useAppSelector(selectAccessToken);
  const isSuperadmin = decodeAccessToken(accessToken ?? "")?.roles.includes("SUPERADMIN") ?? false;

  const { data: status, isLoading: loadingStatus } = useGetSystemHealthStatusQuery(undefined, { skip: !isSuperadmin });
  const { data: history, isLoading: loadingHistory } = useGetSystemHealthHistoryQuery(
    { days: HISTORY_WINDOW_DAYS },
    { skip: !isSuperadmin },
  );

  if (!isSuperadmin) {
    return (
      <PageContainer>
        <PageHeader title="System health" />
        <ContentCard>
          <EmptyState title="Not available" description="System health is for the superadmin only." />
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="System health"
        subtitle={status ? `Checked just now · ${status.server.environment}` : undefined}
      />

      <div className="flex flex-col gap-5">
        {loadingStatus || !status ? (
          <LoadingState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <ServiceStatusCard
              label="Database"
              status={status.database.status}
              detail={`${status.database.latencyMs}ms response time`}
            />
            <ServiceStatusCard
              label="Email"
              status={status.email.status}
              detail={status.email.configured ? "Sending configured" : "Not configured"}
            />
            <ServiceStatusCard
              label="API server"
              status={status.server.status}
              detail={`Up for ${formatUptime(status.server.uptimeSeconds)} · ${status.server.memoryUsedMb}MB used`}
            />
          </div>
        )}

        {loadingHistory || !history ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-3">
              <LineChartCard
                title="Database uptime"
                subtitle={`Last ${history.windowDays} days`}
                data={history.uptimeByDay.database}
                categoryKey="date"
                valueKey="uptimePercent"
                valueLabel="% up"
                formatValue={(value) => `${value}%`}
              />
              <LineChartCard
                title="Email uptime"
                subtitle={`Last ${history.windowDays} days`}
                data={history.uptimeByDay.email}
                categoryKey="date"
                valueKey="uptimePercent"
                valueLabel="% up"
                formatValue={(value) => `${value}%`}
              />
              <LineChartCard
                title="API server uptime"
                subtitle={`Last ${history.windowDays} days`}
                data={history.uptimeByDay.apiServer}
                categoryKey="date"
                valueKey="uptimePercent"
                valueLabel="% up"
                formatValue={(value) => `${value}%`}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <PieChartCard title="Database" subtitle="Up vs down, this window" data={history.statusShare.database} />
              <PieChartCard title="Email" subtitle="Up vs down, this window" data={history.statusShare.email} />
              <PieChartCard
                title="API server"
                subtitle="Up vs down, this window"
                data={history.statusShare.apiServer}
              />
            </div>

            <BarChartCard
              title="Database response time distribution"
              subtitle={`Last ${history.windowDays} days, every check`}
              data={history.latencyHistogram}
              categoryKey="bucket"
              valueKey="count"
              valueLabel="Checks"
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}
