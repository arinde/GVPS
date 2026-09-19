import { maskAccountNumber } from "@/common/mask-account-number";

describe("maskAccountNumber", () => {
  it("keeps only the last four digits", () => {
    expect(maskAccountNumber("0123456789")).toBe("******6789");
  });

  it("returns null when there is no account", () => {
    expect(maskAccountNumber(undefined)).toBeNull();
    expect(maskAccountNumber("")).toBeNull();
  });

  it("never reveals more than four digits of a short value", () => {
    expect(maskAccountNumber("1234")).toBe("1234");
  });
});
