import { primaryRoleLabel, ROLE_OPTIONS } from "@/components/auth/roles";
import { ContentCard } from "@/components/common/content-card";
import { DetailList } from "@/components/common/detail-list";
import { PageHeader } from "@/components/common/page-header";
import { formatMonthYear } from "@/lib/dates";
import { staffName } from "@/lib/staff-name";
import type { StaffProfile } from "@/store/api/staff-api";

const roleLabel = (role: string) => ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;

export type StaffProfileDetailsProps = {
  profile: StaffProfile;
  /** The line under the cards: who can change this record, and how. */
  footnote: string;
};

/**
 * A staff record, read-only. Used for "My profile" and for the superadmin
 * looking at a colleague, so both show exactly the same thing.
 */
export function StaffProfileDetails({ profile, footnote }: StaffProfileDetailsProps) {
  const roles = profile.roles.map(({ role }) => role);
  const classes = profile.classAssignments.map(({ classArm }) => `${classArm.classLevel.name}${classArm.name}`);
  const hasAccount = Boolean(profile.accountNumber);

  return (
    <>
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

        <p className="text-muted-foreground text-xs">{footnote}</p>
      </div>
    </>
  );
}
