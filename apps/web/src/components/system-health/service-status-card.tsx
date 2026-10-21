import { ContentCard } from "@/components/common/content-card";
import { StatusPill } from "@/components/common/status-pill";
import type { ServiceStatus } from "@/store/api/system-health-api";

export type ServiceStatusCardProps = {
  label: string;
  status: ServiceStatus;
  detail: string;
};

/** One service's live reachability — status is a pill, never colour alone (AGENTS.md §12). Props only. */
export function ServiceStatusCard({ label, status, detail }: ServiceStatusCardProps) {
  return (
    <ContentCard className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base">{label}</h2>
        <StatusPill tone={status === "UP" ? "success" : "danger"} shape={status === "UP" ? "circle" : "square"}>
          {status === "UP" ? "Up" : "Down"}
        </StatusPill>
      </div>
      <p className="text-muted-foreground text-sm">{detail}</p>
    </ContentCard>
  );
}
