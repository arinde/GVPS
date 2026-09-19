"use client";

import { primaryRoleLabel, ROLE_OPTIONS } from "@/components/auth/roles";
import { ContentCard } from "@/components/common/content-card";
import { DetailList } from "@/components/common/detail-list";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMonthYear } from "@/lib/dates";
import { staffName } from "@/lib/staff-name";
import { useGetMyProfileQuery } from "@/store/api/staff-api";

const roleLabel = (role: string) => ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

/**
 * The signed-in staff member's own record. Read-only: a change to your own
 * details — above all your salary account — goes through the superadmin, so
 * someone who got into this account could not redirect your pay.
 */
export function MyProfileView() {
  const { data: profile, isLoading, isError } = useGetMyProfileQuery();

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-sm" role="status">
          Loading your profile…
        </p>
      </PageContainer>
    );
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <Alert variant="destructive" role="alert">
          <AlertDescription>Your profile could not be loaded. Refresh the page to try again.</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const roles = profile.roles.map(({ role }) => role);
  const classes = profile.classAssignments.map(({ classArm }) => `${classArm.classLevel.name}${classArm.name}`);
  const hasAccount = Boolean(profile.accountNumber);

  return (
    <PageContainer width="form">
      <PageHeader
        title={staffName(profile)}
        subtitle={`${primaryRoleLabel(roles)} · on staff since ${formatMonthYear(profile.createdAt)}`}
      />

      <div className="flex flex-col gap-5">
        <ContentCard>
          <h2 className="mb-3 text-base">Personal details</h2>
          <DetailList
            items={[
              {
                label: "Name",
                value: [profile.firstName, profile.otherNames, profile.lastName].filter(Boolean).join(" "),
              },
              { label: "Email", value: profile.email },
              { label: "Phone", value: profile.phone },
              { label: "Home address", value: profile.address },
            ]}
          />
        </ContentCard>

        <ContentCard>
          <h2 className="mb-3 text-base">Role and classes</h2>
          <DetailList
            items={[
              { label: "Roles", value: roles.map(roleLabel).join(", ") },
              { label: "Classes this session", value: classes.join(", ") || "None allocated" },
            ]}
          />
        </ContentCard>

        <ContentCard>
          <h2 className="mb-3 text-base">Next of kin</h2>
          {profile.nextOfKinName ? (
            <DetailList
              items={[
                { label: "Name", value: profile.nextOfKinName },
                { label: "Relationship", value: profile.nextOfKinRelationship },
                { label: "Phone", value: profile.nextOfKinPhone },
              ]}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Not recorded yet.</p>
          )}
        </ContentCard>

        <ContentCard>
          <h2 className="mb-3 text-base">Salary account</h2>
          {hasAccount ? (
            <DetailList
              items={[
                { label: "Bank", value: profile.bankName },
                { label: "Account number", value: profile.accountNumber, mono: true },
                { label: "Account name", value: profile.accountName },
              ]}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Not recorded yet.</p>
          )}
        </ContentCard>

        <p className="text-muted-foreground text-xs">
          To change any of these details, ask the superadmin. Staff cannot edit their own record, so no one who gets
          into your account can redirect your salary.
        </p>
      </div>
    </PageContainer>
  );
}
