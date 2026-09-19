import { z } from "zod";
import { blankAsUndefined } from "@/common/schemas/blank-as-undefined";

const Bank = blankAsUndefined(z.enum(["Zenith Bank", "Wema Bank"], "Choose a bank from the list"));

describe("blankAsUndefined", () => {
  it("treats a blank as not given", () => {
    expect(Bank.parse("")).toBeUndefined();
    expect(Bank.parse(undefined)).toBeUndefined();
  });

  it("keeps a valid value", () => {
    expect(Bank.parse("Wema Bank")).toBe("Wema Bank");
  });

  it("reports the field's own message, not a generic one", () => {
    const result = Bank.safeParse("Zenith");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Choose a bank from the list");
  });
});
