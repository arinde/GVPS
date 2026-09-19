"use client";

import Link from "next/link";
import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { DetailList } from "@/components/common/detail-list";
import { PageHeader } from "@/components/common/page-header";
import { PortalChildPhoto } from "@/components/portal/portal-child-photo";
import { currentClassLabel, DEPARTMENT, RELATIONSHIP, statusLabel } from "@/components/portal/portal-labels";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ageInYears, formatDate } from "@/lib/dates";
import { staffName } from "@/lib/staff-name";
import { useGetPortalChildQuery, useListPortalChildrenQuery, type PortalChildDetail } from "@/store/api/portal-api";

type Enrolment = PortalChildDetail["enrolments"][number];
const helper = createColumnHelper<StockFeatures, Enrolment>();

// Small enough to sit beside the view; moves to its own columns file when it grows.
const historyColumns = [
  helper.accessor((row) => row.session.name, { id: "session", header: "Session" }),
  helper.accessor((row) => `${row.classArm.classLevel.name}${row.classArm.name}`, { id: "class", header: "Class" }),
  helper.accessor((row) => (row.stream ? DEPARTMENT[row.stream] : "—"), { id: "department", header: "Department" }),
  helper.accessor((row) => statusLabel(row.status), { id: "status", header: "Status" }),
] as ColumnDef<StockFeatures, Enrolment, unknown>[];

/**
 * One child, as their parent sees them: class and form teacher first, then
 * the record the school holds. Read-only — to correct anything, the parent
 * asks the school office. Results, fees and attendance join as the school
 * starts using those modules.
 */
export function PortalChildView({ studentId }: { studentId: string }) {
  const { data: child, isLoading, isError } = useGetPortalChildQuery(studentId);
  const { data: siblings = [] } = useListPortalChildrenQuery();

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading…
      </p>
    );
  }
  if (isError || !child) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>This child could not be found on your account.</AlertDescription>
      </Alert>
    );
  }

  const name = `${child.firstName} ${child.lastName}`;
  const current = child.enrolments.find((enrolment) => enrolment.status === "ACTIVE");

  return (
    <>
      {siblings.length > 1 ? (
        <nav aria-label="Your children" className="mb-4 flex flex-wrap gap-2">
          {siblings.map((sibling) => (
            <Link
              key={sibling.id}
              href={`/portal/children/${sibling.id}`}
              aria-current={sibling.id === child.id ? "page" : undefined}
              className="border-input aria-[current=page]:bg-primary aria-[current=page]:border-primary rounded-full border bg-white px-3 py-1 text-sm font-medium aria-[current=page]:text-white"
            >
              {sibling.firstName}
            </Link>
          ))}
        </nav>
      ) : null}

      <PageHeader title={name} subtitle={`${currentClassLabel(child.enrolments)} · ${child.admissionNo}`} />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <ContentCard className="flex flex-col gap-4">
          <PortalChildPhoto studentId={child.id} name={name} photo={child.photo} className="self-center" />
          <DetailList
            items={[
              { label: "Admission no.", value: child.admissionNo, mono: true },
              { label: "Class", value: current ? currentClassLabel([current]) : null },
              { label: "Department", value: current?.stream ? DEPARTMENT[current.stream] : null },
              { label: "Session", value: current?.session.name },
              {
                label: "Form teacher",
                value: child.formTeacher ? staffName({ ...child.formTeacher, email: "" }) : null,
              },
              { label: "Admitted", value: `${child.admissionYear} into ${child.admittedIntoLevel.name}` },
            ]}
          />
        </ContentCard>

        <div className="flex flex-col gap-5">
          <ContentCard>
            <h2 className="mb-2 text-base">Personal details</h2>
            <DetailList
              items={[
                { label: "Date of birth", value: formatDate(child.dateOfBirth) },
                { label: "Age", value: `${ageInYears(child.dateOfBirth)} years` },
                { label: "Sex", value: child.sex === "FEMALE" ? "Female" : "Male" },
                { label: "State of origin", value: child.stateOfOrigin },
                { label: "LGA", value: child.lga },
                { label: "Home address", value: child.address },
                { label: "Blood group", value: child.bloodGroup },
                { label: "Medical note", value: child.medicalNote },
              ]}
            />
          </ContentCard>

          <ContentCard>
            <h2 className="mb-2 text-base">Parents and guardians on record</h2>
            <DetailList
              items={child.guardians.map(({ guardian, relationship, isPrimary }) => ({
                label: `${RELATIONSHIP[relationship]}${isPrimary ? " · first contact" : ""}`,
                value: `${guardian.firstName} ${guardian.lastName} · ${guardian.phone}`,
              }))}
            />
          </ContentCard>

          <ContentCard flush>
            <h2 className="px-5 pt-5 pb-3 text-base">Class history</h2>
            <DataTable columns={historyColumns} data={child.enrolments} emptyTitle="No classes recorded yet" />
          </ContentCard>

          <p className="text-muted-foreground text-xs">
            Something wrong or out of date? Contact the school office — details are changed only by the school.
          </p>
        </div>
      </div>
    </>
  );
}
