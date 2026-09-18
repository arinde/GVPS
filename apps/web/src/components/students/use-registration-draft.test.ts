import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRegistrationDraft } from "@/components/students/use-registration-draft";

function setup() {
  return renderHook(() => useRegistrationDraft());
}

describe("useRegistrationDraft", () => {
  it("starts with one primary guardian, because one is required", () => {
    const { result } = setup();

    expect(result.current.draft.guardians).toHaveLength(1);
    expect(result.current.draft.guardians[0].isPrimary).toBe(true);
  });

  it("clears the department when the class changes", () => {
    const { result } = setup();
    act(() => result.current.patch({ classArmId: "ss1a", stream: "SCIENCE" }));

    act(() => result.current.patch({ classArmId: "p4a" }));

    expect(result.current.draft.stream).toBeUndefined();
  });

  it("keeps the department when something else changes", () => {
    const { result } = setup();
    act(() => result.current.patch({ classArmId: "ss1a", stream: "SCIENCE" }));

    act(() => result.current.patch({ firstName: "Fatima" }));

    expect(result.current.draft.stream).toBe("SCIENCE");
  });

  it("clears only the error of the field being edited", () => {
    const { result } = setup();
    act(() => result.current.setFieldErrors({ firstName: "Required", lastName: "Required" }));

    act(() => result.current.patch({ firstName: "F" }));

    expect(result.current.fieldErrors).toEqual({ lastName: "Required" });
  });

  it("clears a guardian field's error when that field is edited", () => {
    const { result } = setup();
    act(() => result.current.setFieldErrors({ "guardians.0.phone": "Invalid", "guardians.0.lastName": "Required" }));

    act(() => result.current.patchGuardian(0, { phone: "08012345678" }));

    expect(result.current.fieldErrors).toEqual({ "guardians.0.lastName": "Required" });
  });

  it("promotes the next guardian when the primary one is removed", () => {
    const { result } = setup();
    act(() => result.current.addGuardian());

    act(() => result.current.removeGuardian(0));

    expect(result.current.draft.guardians).toHaveLength(1);
    expect(result.current.draft.guardians[0].isPrimary).toBe(true);
  });

  it("keeps exactly one primary guardian", () => {
    const { result } = setup();
    act(() => result.current.addGuardian());

    act(() => result.current.makeGuardianPrimary(1));

    expect(result.current.draft.guardians.map((guardian) => guardian.isPrimary)).toEqual([false, true]);
  });

  it("keeps the class and department after a save and clears the rest", () => {
    const { result } = setup();
    act(() => result.current.patch({ classArmId: "ss1a", stream: "ARTS", firstName: "Fatima" }));

    act(() => result.current.resetKeepingClass());

    expect(result.current.draft).toMatchObject({ classArmId: "ss1a", stream: "ARTS", firstName: "" });
    expect(result.current.fieldErrors).toEqual({});
  });
});
