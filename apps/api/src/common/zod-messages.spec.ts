import { z } from "zod";
import "@/common/zod-messages";

function firstMessage(schema: z.ZodType, value: unknown): string {
  const result = schema.safeParse(value);
  if (result.success) throw new Error("expected a validation failure");
  return result.error.issues[0].message;
}

describe("plain-English zod messages", () => {
  it("says Required for a missing field", () => {
    expect(firstMessage(z.object({ name: z.string() }), {})).toBe("Required");
  });

  it("says Required for an empty required string", () => {
    expect(firstMessage(z.string().min(1), "")).toBe("Required");
  });

  it("states the minimum length in characters", () => {
    expect(firstMessage(z.string().min(10), "short")).toBe("Must be at least 10 characters");
  });

  it("states the maximum length in characters", () => {
    expect(firstMessage(z.string().max(5), "too long")).toBe("Must be 5 characters or fewer");
  });

  it("describes an invalid email", () => {
    expect(firstMessage(z.email(), "not-an-email")).toBe("Enter a valid email address");
  });

  it("describes an invalid date", () => {
    expect(firstMessage(z.iso.date(), "31/12/2026")).toBe("Enter a valid date");
  });

  it("lets a schema's own message win", () => {
    expect(firstMessage(z.string().min(10, "Use at least 10 characters"), "x")).toBe("Use at least 10 characters");
  });
});
