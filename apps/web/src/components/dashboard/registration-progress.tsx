import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { ProgressBar } from "@/components/common/progress-bar";
import type { DashboardOverview } from "@/store/api/dashboard-api";

export type RegistrationProgressProps = { classes: DashboardOverview["progress"] };

/**
 * FEATURES.md §3.5: "Primary 3A: 28 of 34 entered". The bar needs a class
 * size to measure against; a class without one shows its count alone rather
 * than a bar that means nothing.
 */
export function RegistrationProgress({ classes }: RegistrationProgressProps) {
  return (
    <ContentCard flush>
      <div className="border-border flex items-center gap-2.5 border-b px-5 py-3">
        <h2 className="text-base">Registration</h2>
        <p className="text-muted-foreground text-xs">by class, this session</p>
        <AppLinkButton href="/students" variant="secondary" size="small" className="ml-auto">
          Registry
        </AppLinkButton>
      </div>

      <ul>
        {classes.map((row) => (
          <li key={row.id} className="border-border flex items-center gap-2.5 border-b px-5 py-2.5 last:border-b-0">
            <span className="text-foreground w-24 shrink-0 text-sm font-medium">{row.label}</span>
            <span className="flex-1">
              {row.capacity ? (
                <ProgressBar value={row.enrolled / row.capacity} label={`${row.label} registration`} />
              ) : null}
            </span>
            <span className="text-muted-foreground w-24 shrink-0 text-right text-xs tabular-nums">
              {row.capacity ? `${row.enrolled} of ${row.capacity}` : `${row.enrolled} enrolled`}
            </span>
          </li>
        ))}
      </ul>
    </ContentCard>
  );
}
