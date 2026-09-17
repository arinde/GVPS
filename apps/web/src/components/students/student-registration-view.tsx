"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { StudentRegistrationForm } from "@/components/students/student-registration-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extractErrorMessage } from "@/lib/extract-error-message";
import { useGetCurrentPeriodQuery, useListClassArmsQuery } from "@/store/api/academic-api";
import { useRegisterStudentMutation, type GuardianInput, type RegisterStudentRequest } from "@/store/api/students-api";

function emptyGuardian(isPrimary: boolean): GuardianInput {
  return { firstName: "", lastName: "", phone: "", relationship: "FATHER", isPrimary };
}

function blankDraft(classArmId = ""): RegisterStudentRequest {
  return {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "FEMALE",
    dateOfAdmission: new Date().toISOString().slice(0, 10),
    classArmId,
    guardians: [],
  };
}

/**
 * Wires the registration form to the API (AGENTS.md §1: only the container
 * knows where data comes from).
 *
 * After a save it keeps the chosen class and clears everything else, because
 * the office registers a class at a time — re-picking the class for each of
 * thirty students is the difference between this being used and abandoned
 * (PLAN.md §9).
 */
export function StudentRegistrationView() {
  const { data: arms = [], isLoading: armsLoading } = useListClassArmsQuery();
  const { data: current } = useGetCurrentPeriodQuery();
  const [registerStudent, { isLoading: isSubmitting }] = useRegisterStudentMutation();

  const [draft, setDraft] = useState<RegisterStudentRequest>(blankDraft());
  const [errorMessage, setErrorMessage] = useState<string>();
  const [lastRegistered, setLastRegistered] = useState<{ admissionNo: string; name: string }>();

  function patch(changes: Partial<RegisterStudentRequest>) {
    setDraft((previous) => ({ ...previous, ...changes }));
  }

  function patchGuardian(index: number, changes: Partial<GuardianInput>) {
    setDraft((previous) => ({
      ...previous,
      guardians: previous.guardians.map((guardian, i) => (i === index ? { ...guardian, ...changes } : guardian)),
    }));
  }

  function addGuardian() {
    setDraft((previous) => ({
      ...previous,
      guardians: [...previous.guardians, emptyGuardian(previous.guardians.length === 0)],
    }));
  }

  function removeGuardian(index: number) {
    setDraft((previous) => ({ ...previous, guardians: previous.guardians.filter((_, i) => i !== index) }));
  }

  function makeGuardianPrimary(index: number) {
    setDraft((previous) => ({
      ...previous,
      guardians: previous.guardians.map((guardian, i) => ({ ...guardian, isPrimary: i === index })),
    }));
  }

  async function submit() {
    setErrorMessage(undefined);
    try {
      const student = await registerStudent(cleaned(draft)).unwrap();
      setLastRegistered({
        admissionNo: student.admissionNo,
        name: `${student.lastName}, ${student.firstName}`,
      });
      setDraft(blankDraft(draft.classArmId));
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, "Could not register this student. Please try again."));
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
        value={draft}
        arms={arms}
        isSubmitting={isSubmitting || armsLoading}
        errorMessage={errorMessage}
        onChange={patch}
        onGuardianChange={patchGuardian}
        onAddGuardian={addGuardian}
        onRemoveGuardian={removeGuardian}
        onMakeGuardianPrimary={makeGuardianPrimary}
        onSubmit={submit}
      />
    </div>
  );
}

/** Drops empty optional strings so the API's optional() fields stay absent. */
function cleaned(draft: RegisterStudentRequest): RegisterStudentRequest {
  const entries = Object.entries(draft).filter(([, value]) => value !== "");
  return Object.fromEntries(entries) as RegisterStudentRequest;
}
