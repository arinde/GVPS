"use client";

import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { attentionItems } from "@/components/dashboard/attention-items";
import { AttentionList } from "@/components/dashboard/attention-list";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RegistrationProgress } from "@/components/dashboard/registration-progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { greeting } from "@/lib/dates";
import { useGetDashboardQuery } from "@/store/api/dashboard-api";

export type AdminDashboardViewProps = { firstName: string | null };

/**
 * STITCH-SCREENS.md screen 1 for the superadmin and principal, limited to
 * Phase 1's data: the roll, staff and class allocation. The fees and
 * attendance cards arrive with those modules rather than showing zeros.
 */
export function AdminDashboardView({ firstName }: AdminDashboardViewProps) {
  const { data: overview, isLoading, isError } = useGetDashboardQuery();

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-sm" role="status">
          Loading the dashboard…
        </p>
      </PageContainer>
    );
  }

  if (isError || !overview) {
    return (
      <PageContainer>
        <Alert variant="destructive" role="alert">
          <AlertDescription>The dashboard could not be loaded. Check the connection and refresh.</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const items = attentionItems(overview);
  const { students, staff, classes } = overview;
  const allocated = classes.total - classes.withoutTeacher;

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        subtitle={[
          overview.session ? `${overview.session.name} session` : "No current session",
          items.length ? `${items.length} thing${items.length === 1 ? "" : "s"} need you` : "all clear",
        ].join(" · ")}
      />

      <div className="flex flex-col gap-3.5">
        <AttentionList items={items} />

        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            wash="lavender"
            label="Students enrolled"
            value={students.enrolled.toLocaleString("en-GB")}
            detail={`Nursery ${students.bySection.NURSERY} · Primary ${students.bySection.PRIMARY} · Junior ${students.bySection.JUNIOR} · Senior ${students.bySection.SENIOR}`}
          />
          <StatCard
            wash="yellow"
            label="Registered this week"
            value={students.registeredThisWeek.toLocaleString("en-GB")}
            detail="New records in the last seven days"
          />
          <StatCard
            wash="lavender"
            label="Classes with a form teacher"
            value={`${allocated} of ${classes.total}`}
            detail={classes.withoutTeacher ? `${classes.withoutTeacher} still to allocate` : "Every class allocated"}
          />
          <StatCard
            wash="yellow"
            label="Staff accounts"
            value={staff.total.toLocaleString("en-GB")}
            detail={staff.passwordNotSet ? `${staff.passwordNotSet} yet to sign in` : "Everyone has signed in"}
          />
        </div>

        <div className="grid gap-[18px] lg:grid-cols-[55fr_45fr]">
          {overview.progress.length ? (
            <RegistrationProgress classes={overview.progress} />
          ) : (
            <ContentCard>
              <p className="text-muted-foreground text-sm">No classes are set up yet.</p>
            </ContentCard>
          )}
          <RecentActivity entries={overview.activity} />
        </div>
      </div>
    </PageContainer>
  );
}
