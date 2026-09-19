import { CreateStaffSchema } from "@/auth/schemas/create-staff.schema";

const valid = {
  firstName: "Ngozi",
  lastName: "Okafor",
  phone: "0801 234 5678",
  email: "ngozi@school.test",
  address: "12 Allen Avenue, Ikeja",
  nextOfKinName: "Emeka Okafor",
  nextOfKinRelationship: "Spouse",
  nextOfKinPhone: "08087654321",
  roles: ["FORM_TEACHER"],
};

function issues(input: Record<string, unknown>) {
  const result = CreateStaffSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

describe("CreateStaffSchema", () => {
  it("accepts a staff member with no salary account yet", () => {
    expect(issues(valid)).toEqual([]);
  });

  it("accepts a complete salary account", () => {
    expect(
      issues({ ...valid, bankName: "Zenith Bank", accountNumber: "0123456789", accountName: "Ngozi Okafor" }),
    ).toEqual([]);
  });

  it("requires the rest of the account once any part is given", () => {
    expect(issues({ ...valid, bankName: "Zenith Bank" })).toEqual([
      "accountNumber: Enter the account number",
      "accountName: Enter the name on the account",
    ]);
  });

  it("requires a 10-digit account number", () => {
    expect(
      issues({ ...valid, bankName: "Zenith Bank", accountNumber: "12345", accountName: "Ngozi Okafor" }),
    ).toContain("accountNumber: An account number is exactly 10 digits");
  });

  it("only accepts a bank from the list", () => {
    expect(
      issues({ ...valid, bankName: "Zenith", accountNumber: "0123456789", accountName: "Ngozi Okafor" }),
    ).toContain("bankName: Choose a bank from the list");
  });

  it("requires a home address and next of kin", () => {
    expect(issues({ ...valid, address: undefined, nextOfKinName: undefined })).toEqual(
      expect.arrayContaining([expect.stringMatching(/^address:/), expect.stringMatching(/^nextOfKinName:/)]),
    );
  });

  it("normalises the next of kin's phone like any other", () => {
    const parsed = CreateStaffSchema.parse(valid);
    expect(parsed.nextOfKinPhone).toBe("+2348087654321");
  });
});
