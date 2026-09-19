"use client";

import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { PortalAccessRow } from "@/components/students/portal-access-row";
import { StudentProfilePhoto } from "@/components/students/student-profile-photo";
import { StudentRecordCard } from "@/components/students/student-record-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate, formatMonthYear } from "@/lib/dates";
import { decodeAccessToken } from "@/lib/decode-access-token";
import { useGetMyAccessQuery } from "@/store/api/access-api";
import { useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "@/store/slices/auth-slice";
import { useGetStudentQuery, type StudentProfile } from "@/store/api/students-api";

type Enrolment = StudentProfile["enrolments"][number];

const DEPARTMENT = { SCIENCE: "Science", ARTS: "Arts", COMMERCIAL: "Commercial" } as const;
const RELATIONSHIP_LABEL = { FATHER: "Father", MOTHER: "Mother", GUARDIAN: "Guardian" } as const;
const helper = createColumnHelper<StockFeatures, Enrolment>();

// Small enough to sit beside the view; move to a columns.tsx when it grows.
const enrolmentColumns = [
  helper.accessor((row) => row.session.name, { id: "session", header: "Session" }),
  helper.accessor((row) => `${row.classArm.classLevel.name}${row.classArm.name}`, { id: "class", header: "Class" }),
  helper.accessor((row) => (row.stream ? DEPARTMENT[row.stream] : "—"), { id: "department", header: "Department" }),
  helper.accessor((row) => row.status.charAt(0) + row.status.slice(1).toLowerCase(), {
    id: "status",
    header: "Status",
  }),
  helper.accessor((row) => formatDate(row.enrolledOn), { id: "enrolled", header: "Enrolled" }),
] as ColumnDef<StockFeatures, Enrolment, unknown>[];

/**
 * One student's record (STITCH-SCREENS.md screen 5). The API decides whether
 * the viewer may see this student at all — a teacher gets "not found" for a
 * child outside their classes — so this view only renders what comes back.
 *
 * Results, fees and attendance tabs join the right column as those modules
 * are built; until then only enrolment history exists to show.
 */
export function StudentProfileView({ studentId }: { studentId: string }) {
  const { data: student, isLoading, isError } = useGetStudentQuery(studentId);
  const { data: access } = useGetMyAccessQuery();
  const accessToken = useAppSelector(selectAccessToken);
  // Only the superadmin corrects records; the API enforces it regardless.
  const canEdit = (accessToken ? decodeAccessToken(accessToken)?.roles : undefined)?.includes("SUPERADMIN") ?? false;

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-muted-foreground text-sm" role="status">
          Loading student…
        </p>
      </PageContainer>
    );
  }

  if (isError || !student) {
    return (
      <PageContainer>
        <Alert variant="destructive" role="alert">
          <AlertDescription>This student could not be found, or is not in a class you have access to.</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const current = student.enrolments.find((enrolment) => enrolment.status === "ACTIVE");
  const currentClass = current ? `${current.classArm.classLevel.name}${current.classArm.name}` : "Not enrolled";
  const name = `${student.lastName}, ${student.firstName}${student.otherNames ? ` ${student.otherNames}` : ""}`;

  return (
    <PageContainer>
      <PageHeader
        title={name}
        subtitle={`${currentClass} · ${student.admissionNo} · admitted ${
          student.dateOfAdmission ? formatMonthYear(student.dateOfAdmission) : student.admissionYear
        }`}
        actions={
          canEdit ? (
            <AppLinkButton href={`/students/${student.id}/edit`} variant="secondary">
              <Pencil aria-hidden="true" />
              Edit details
            </AppLinkButton>
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <StudentRecordCard
          student={student}
          photo={
            <StudentProfilePhoto
              studentId={student.id}
              name={`${student.lastName}, ${student.firstName}`}
              photo={student.photo}
              canUpload={access?.canRegister ?? false}
            />
          }
        />

        <div className="flex flex-col gap-5">
          <ContentCard flush>
            <h2 className="px-5 pt-5 pb-3 text-base">Enrolment history</h2>
            <DataTable columns={enrolmentColumns} data={student.enrolments} emptyTitle="No enrolments recorded" />
          </ContentCard>

          {/* Portal logins open children's records, so only the superadmin issues them (the API agrees). */}
          {canEdit ? (
            <ContentCard>
              <h2 className="text-base">Family portal</h2>
              <p className="text-muted-foreground mb-1 text-xs">
                One login per phone number shows the parent every child linked to it.
              </p>
              <ul>
                {student.guardians.map(({ guardian, relationship }) => (
                  <PortalAccessRow
                    key={guardian.id}
                    name={`${guardian.firstName} ${guardian.lastName}`}
                    relationship={RELATIONSHIP_LABEL[relationship]}
                    phone={guardian.phone}
                  />
                ))}
              </ul>
            </ContentCard>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}
