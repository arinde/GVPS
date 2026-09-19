"use client";

import { createColumnHelper, type ColumnDef, type StockFeatures } from "@tanstack/react-table";
import { ContentCard } from "@/components/common/content-card";
import { DataTable } from "@/components/common/data-table";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { StudentRecordCard } from "@/components/students/student-record-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate, formatMonthYear } from "@/lib/dates";
import { useGetStudentQuery, type StudentProfile } from "@/store/api/students-api";

type Enrolment = StudentProfile["enrolments"][number];

const DEPARTMENT = { SCIENCE: "Science", ARTS: "Arts", COMMERCIAL: "Commercial" } as const;
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
        subtitle={`${currentClass} · ${student.admissionNo} · admitted ${formatMonthYear(student.dateOfAdmission)}`}
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <StudentRecordCard student={student} />

        <ContentCard flush>
          <h2 className="px-5 pt-5 pb-3 text-base">Enrolment history</h2>
          <DataTable columns={enrolmentColumns} data={student.enrolments} emptyTitle="No enrolments recorded" />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
