import { useState } from "react";
import { withoutFieldErrors } from "@/lib/api-error";
import type { GuardianInput, RegisterStudentRequest } from "@/store/api/students-api";

function emptyGuardian(isPrimary: boolean): GuardianInput {
  return { firstName: "", lastName: "", phone: "", relationship: "FATHER", isPrimary };
}

/** A fresh form. Starts with one guardian block open, because one is required. */
export function blankDraft(classArmId = "", stream?: RegisterStudentRequest["stream"]): RegisterStudentRequest {
  return {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    sex: "FEMALE",
    dateOfAdmission: new Date().toISOString().slice(0, 10),
    classArmId,
    stream,
    guardians: [emptyGuardian(true)],
  };
}

/**
 * The registration draft and its field errors, and every edit the form can
 * make to them. Kept apart from the view so the rules — a new class clears
 * the department, one guardian is always primary, an edit clears only its own
 * error — live in one place and are tested on their own.
 *
 * Form draft state is local and not derivable from anything, which is the
 * case useState is for (AGENTS.md §2).
 */
export function useRegistrationDraft() {
  const [draft, setDraft] = useState<RegisterStudentRequest>(blankDraft());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function patch(changes: Partial<RegisterStudentRequest>) {
    setDraft((previous) => {
      const classChanged = changes.classArmId !== undefined && changes.classArmId !== previous.classArmId;
      // A different class may not be senior, or may fix its own department,
      // so a department chosen for the old class never carries over — unless
      // this same change sets one explicitly, which then wins.
      const clearStream = classChanged && !("stream" in changes);
      return { ...previous, ...changes, ...(clearStream ? { stream: undefined } : {}) };
    });
    setFieldErrors((errors) => withoutFieldErrors(errors, Object.keys(changes)));
  }

  function patchGuardian(index: number, changes: Partial<GuardianInput>) {
    setDraft((previous) => ({
      ...previous,
      guardians: previous.guardians.map((guardian, i) => (i === index ? { ...guardian, ...changes } : guardian)),
    }));
    const cleared = Object.keys(changes).map((key) => `guardians.${index}.${key}`);
    setFieldErrors((errors) => withoutFieldErrors(errors, cleared));
  }

  function addGuardian() {
    setDraft((previous) => ({ ...previous, guardians: [...previous.guardians, emptyGuardian(false)] }));
  }

  function removeGuardian(index: number) {
    setDraft((previous) => {
      const remaining = previous.guardians.filter((_, i) => i !== index);
      // Removing the primary contact would leave none; promote the first.
      const hasPrimary = remaining.some((guardian) => guardian.isPrimary);
      return {
        ...previous,
        guardians: hasPrimary ? remaining : remaining.map((guardian, i) => ({ ...guardian, isPrimary: i === 0 })),
      };
    });
    // Indexes shift after a removal, so stale guardian errors would point at
    // the wrong block. Clear them; the next submit re-reports anything real.
    setFieldErrors((errors) => withoutFieldErrors(errors, ["guardians."]));
  }

  function makeGuardianPrimary(index: number) {
    setDraft((previous) => ({
      ...previous,
      guardians: previous.guardians.map((guardian, i) => ({ ...guardian, isPrimary: i === index })),
    }));
  }

  /** After a successful save: keep the class and department, clear the rest. */
  function resetKeepingClass() {
    setDraft((previous) => blankDraft(previous.classArmId, previous.stream));
    setFieldErrors({});
  }

  return {
    draft,
    fieldErrors,
    setFieldErrors,
    patch,
    patchGuardian,
    addGuardian,
    removeGuardian,
    makeGuardianPrimary,
    resetKeepingClass,
  };
}
