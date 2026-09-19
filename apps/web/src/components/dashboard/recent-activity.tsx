import { ContentCard } from "@/components/common/content-card";
import { formatWhen } from "@/lib/dates";
import type { DashboardOverview } from "@/store/api/dashboard-api";

export type RecentActivityProps = { entries: DashboardOverview["activity"] };

/** STITCH-SCREENS.md screen 1, region 3 right: the latest audit entries, newest first. */
export function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <ContentCard flush>
      <h2 className="border-border border-b px-5 py-3 text-base">Recent activity</h2>

      {entries.length === 0 ? (
        <p className="text-muted-foreground px-5 py-4 text-sm">Nothing recorded yet.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id} className="border-border flex items-start gap-3 border-b px-5 py-2.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">{entry.title}</p>
                <p className="text-muted-foreground truncate text-xs">{entry.detail}</p>
              </div>
              <time dateTime={entry.at} className="text-muted-foreground font-mono text-xs">
                {formatWhen(entry.at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </ContentCard>
  );
}
