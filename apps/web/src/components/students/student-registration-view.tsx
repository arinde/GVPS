"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StudentRegistrationForm } from "@/components/students/student-registration-form";
import { useRegistrationDraft } from "@/components/students/use-registration-draft";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notify } from "@/lib/notify";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import { useGetBloodGroupsQuery, useGetStatesQuery } from "@/store/api/reference-api";
import { useRegisterStudentMutation, type RegisterStudentRequest } from "@/store/api/students-api";

/**
 * Wires the registration form to the API (AGENTS.md §1: only the container
 * knows where data comes from). Draft editing rules live in
 * useRegistrationDraft.
 */
export function StudentRegistrationView() {
  const { data: arms = [], isLoading: armsLoading } = useListClassArmsQuery();
  const { data: current } = useGetCurrentPeriodQuery();
  const { data: states = [] } = useGetStatesQuery();
  const { data: bloodGroups = [] } = useGetBloodGroupsQuery();
  const [registerStudent, { isLoading: isSubmitting }] = useRegisterStudentMutation();

  const form = useRegistrationDraft();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [lastRegistered, setLastRegistered] = useState<{ admissionNo: string; name: string }>();

  async function submit() {
    setErrorMessage(undefined);
    try {
      const student = await registerStudent(cleaned(form.draft)).unwrap();
      const name = `${student.lastName}, ${student.firstName}`;
      setLastRegistered({ admissionNo: student.admissionNo, name });
      form.resetKeepingClass();
      // Kept up longer than a normal success: the number has to be copied
      // onto the student's file.
      notify.success(`Registered ${name}`, {
        description: `Admission number ${student.admissionNo}`,
        durationMs: 12_000,
      });
    } catch (error) {
      const parsed = notify.error(error, "Could not register this student. Please try again.");
      form.setFieldErrors(parsed.fieldErrors);
      setErrorMessage(parsed.message);
      setLastRegistered(undefined);
    }
  }

  if (!current?.session) {
    return (
      <Alert role="alert">
        <AlertTitle>No current session</AlertTitle>
        <AlertDescription>
          Registration writes an enrolment into the current academic session, and none is set. Set one under Academic
          before registering students.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Registering into <span className="font-medium">{current.session.name}</span>
        {current.term ? ` · ${current.term.name}` : null}
      </p>

      {lastRegistered ? (
        <Alert role="status">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Registered {lastRegistered.name}</AlertTitle>
          <AlertDescription>
            Admission number <span className="font-mono font-medium">{lastRegistered.admissionNo}</span>. Write it on
            the student&apos;s file before continuing.
          </AlertDescription>
        </Alert>
      ) : null}

      <StudentRegistrationForm
        value={form.draft}
        arms={arms}
        states={states}
        bloodGroups={bloodGroups}
        isSubmitting={isSubmitting || armsLoading}
        errorMessage={errorMessage}
        fieldErrors={form.fieldErrors}
        onChange={form.patch}
        onGuardianChange={form.patchGuardian}
        onAddGuardian={form.addGuardian}
        onRemoveGuardian={form.removeGuardian}
        onMakeGuardianPrimary={form.makeGuardianPrimary}
        onSubmit={submit}
      />
    </div>
  );
}

/** Drops empty optional values so the API's optional() fields stay absent. */
function cleaned(draft: RegisterStudentRequest): RegisterStudentRequest {
  const entries = Object.entries(draft).filter(([, value]) => value !== "" && value !== undefined);
  return Object.fromEntries(entries) as RegisterStudentRequest;
}
