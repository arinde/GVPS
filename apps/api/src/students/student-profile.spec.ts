import { withSiblings } from "@/students/student-profile";

const sibling = (id: string, first: string) => ({
  student: {
    id,
    firstName: first,
    lastName: "Ibrahim",
    enrolments: [{ classArm: { name: "B", classLevel: { name: "Primary 2" } } }],
  },
});

const student = {
  id: "fatima",
  guardians: [
    { relationship: "FATHER", guardian: { id: "musa", firstName: "Musa", students: [sibling("amina", "Amina")] } },
    // Amina again, through the mother — must appear once, not twice.
    { relationship: "MOTHER", guardian: { id: "aisha", firstName: "Aisha", students: [sibling("amina", "Amina")] } },
  ],
};

describe("withSiblings", () => {
  it("lists each sibling once, with their current class", () => {
    expect(withSiblings(student, true).siblings).toEqual([
      { id: "amina", firstName: "Amina", lastName: "Ibrahim", className: "Primary 2B" },
    ]);
  });

  it("lists no siblings for a reader limited to their own classes", () => {
    expect(withSiblings(student, false).siblings).toEqual([]);
  });

  it("strips the nested sibling data from the guardians either way", () => {
    for (const include of [true, false]) {
      const shaped = withSiblings(student, include);
      expect(JSON.stringify(shaped.guardians)).not.toContain("Amina");
      expect(shaped.guardians[0].guardian).toEqual({ id: "musa", firstName: "Musa" });
    }
  });
});
