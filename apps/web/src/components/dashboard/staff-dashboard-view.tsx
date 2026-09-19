"use client";

import { GraduationCap, UserPlus } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { AttentionList } from "@/components/dashboard/attention-list";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RegistrationProgress } from "@/components/dashboard/registration-progress";
import { staffAttentionItems } from "@/components/dashboard/staff-attention-items";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGetMyDashboardQuery } from "@/store/api/dashboard-api";

export type StaffDashboardViewProps = { greeting: string };

/**
 * The home page for teachers, the bursar and the secretary (STITCH-SCREENS.md
 * screen 13, with Phase 1's data): their classes, the students in them, and
 * what needs doing. A teacher's figures cover only their allocated classes.
 */
export function StaffDashboardView({ greeting }: StaffDashboardViewProps) {
  const { data, isLoading, isError } = useGetMyDashboardQuery();

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-sm" role="status">
          Loading your dashboard…
        </p>
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <Alert variant="destructive" role="alert">
          <AlertDescription>Your dashboard could not be loaded. Check the connection and refresh.</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const mine = data.scope === "arms";
  const items = staffAttentionItems(data);
  const girls = data.classes.reduce((sum, row) => sum + row.girls, 0);
  const boys = data.classes.reduce((sum, row) => sum + row.boys, 0);

  return (
    <PageContainer>
      <PageHeader
        title={greeting}
        subtitle={[
          data.session ? `${data.session.name} session` : "No current session",
          mine
            ? `${data.classes.length} class${data.classes.length === 1 ? "" : "es"} allocated to you`
            : "whole school",
        ].join(" · ")}
        actions={
          <>
            <AppLinkButton href="/students" variant="secondary">
              <GraduationCap aria-hidden="true" />
              {mine ? "My students" : "Registry"}
            </AppLinkButton>
            {data.canRegister && data.classes.length > 0 ? (
              <AppLinkButton href="/students/new">
                <UserPlus aria-hidden="true" />
                Register student
              </AppLinkButton>
            ) : null}
          </>
        }
      />

      <div className="flex flex-col gap-3.5">
        {items.length ? <AttentionList items={items} title="To do" caption="From your classes" /> : null}

        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            wash="lavender"
            label={mine ? "Students in my classes" : "Students"}
            value={data.students.total.toLocaleString("en-GB")}
            detail={`Girls ${girls} · Boys ${boys}`}
          />
          <StatCard
            wash="yellow"
            label="Registered this week"
            value={data.students.registeredThisWeek.toLocaleString("en-GB")}
            detail="New records in the last seven days"
          />
          <StatCard
            wash="lavender"
            label="Without a photo"
            value={data.students.withoutPhoto.toLocaleString("en-GB")}
            detail={data.students.withoutPhoto ? "Add from each student's profile" : "Every student has a photo"}
          />
          <StatCard
            wash="yellow"
            label={mine ? "My classes" : "Classes"}
            value={data.classes.length.toLocaleString("en-GB")}
            detail={
              mine ? data.classes.map((row) => row.label).join(", ") || "None allocated yet" : "Across the school"
            }
          />
        </div>

        <div className="grid gap-[18px] lg:grid-cols-[55fr_45fr]">
          {data.classes.length ? <RegistrationProgress classes={data.classes} /> : <span />}
          <RecentActivity
            title="Recently registered"
            emptyText={mine ? "No students in your classes yet." : "No students registered yet."}
            entries={data.recent.map((student) => ({
              id: student.id,
              at: student.registeredAt,
              title: student.name,
              detail: [student.className, student.admissionNo].filter(Boolean).join(" · "),
            }))}
          />
        </div>
      </div>
    </PageContainer>
  );
}
