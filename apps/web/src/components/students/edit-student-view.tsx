"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLinkButton } from "@/components/common/app-button";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { EditGuardianCard } from "@/components/students/edit-guardian-card";
import { EditStudentDetailsForm } from "@/components/students/edit-student-details-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import { useGetBloodGroupsQuery, useGetStatesQuery } from "@/store/api/reference-api";
import {
  useGetStudentQuery,
  useUpdateStudentMutation,
  type StudentProfile,
  type UpdateStudentRequest,
} from "@/store/api/students-api";

/** The saved record as a form draft: nulls become empty fields, dates become yyyy-mm-dd. */
function toDraft(student: StudentProfile): UpdateStudentRequest {
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    otherNames: student.otherNames ?? "",
    dateOfBirth: student.dateOfBirth.slice(0, 10),
    sex: student.sex,
    stateOfOrigin: student.stateOfOrigin ?? "",
    lga: student.lga ?? "",
    address: student.address ?? "",
    bloodGroup: student.bloodGroup ?? "",
    medicalNote: student.medicalNote ?? "",
    previousSchool: student.previousSchool ?? "",
    dateOfAdmission: student.dateOfAdmission?.slice(0, 10) ?? "",
  };
}

/** The student's own details, once loaded. Keyed on the student id by the caller. */
function StudentDetailsEditor({ student }: { student: StudentProfile }) {
  const router = useRouter();
  // The person's unsaved edits, seeded once from the saved record (AGENTS.md §2).
  const [draft, setDraft] = useState<UpdateStudentRequest>(() => toDraft(student));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string>();
  const [updateStudent, { isLoading }] = useUpdateStudentMutation();
  const { data: states = [] } = useGetStatesQuery();
  const { data: bloodGroups = [] } = useGetBloodGroupsQuery();

  function patch(changes: Partial<UpdateStudentRequest>) {
    setDraft((previous) => ({ ...previous, ...changes }));
    setFieldErrors((errors) => withoutFieldErrors(errors, Object.keys(changes)));
  }

  async function save() {
    setErrorMessage(undefined);
    const details = Object.fromEntries(
      Object.entries(draft).filter(([, value]) => value !== ""),
    ) as UpdateStudentRequest;
    try {
      const { changed } = await updateStudent({ studentId: student.id, details }).unwrap();
      notify.success(changed ? `Saved ${draft.lastName}, ${draft.firstName}` : "Nothing had changed");
      router.push(`/students/${student.id}`);
    } catch (error) {
      const parsed = notify.error(error, "Could not save the student's details.");
      setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
    }
  }

  return (
    <EditStudentDetailsForm
      value={draft}
      admissionYear={student.admissionYear}
      states={states}
      bloodGroups={bloodGroups}
      onChange={patch}
      onSubmit={save}
      isSubmitting={isLoading}
      errorMessage={errorMessage}
      fieldErrors={fieldErrors}
    />
  );
}

/**
 * The superadmin correcting a student's record and their guardians' details.
 * The API is superadmin-only and audits every change with before and after.
 */
export function EditStudentView({ studentId }: { studentId: string }) {
  const { data: student, isLoading, isError } = useGetStudentQuery(studentId);

  return (
    <PageContainer width="form">
      <PageHeader
        title={student ? `Edit ${student.lastName}, ${student.firstName}` : "Edit student"}
        subtitle={
          student
            ? `${student.admissionNo} · changes are recorded in the audit log`
            : "Changes are recorded in the audit log"
        }
        actions={
          <AppLinkButton href={`/students/${studentId}`} variant="secondary">
            Back to profile
          </AppLinkButton>
        }
      />
      {isLoading ? (
        <p className="text-muted-foreground text-sm" role="status">
          Loading…
        </p>
      ) : isError || !student ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>This student could not be found.</AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-8">
          <StudentDetailsEditor key={student.id} student={student} />
          <section className="flex flex-col gap-4" aria-label="Parents and guardians">
            <h2 className="text-lg">Parents and guardians</h2>
            {student.guardians.map(({ guardian, relationship }) => (
              <EditGuardianCard
                key={guardian.id}
                guardian={guardian}
                relationship={relationship}
                hasSiblings={student.siblings.length > 0}
              />
            ))}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
