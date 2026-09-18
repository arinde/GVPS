import { describe, expect, it } from "vitest";
import { humanizePath, parseApiError, scopedErrors, withoutFieldErrors } from "@/lib/api-error";

describe("parseApiError", () => {
  it("reads the exact response that surfaced this bug", () => {
    const error = {
      status: 400,
      data: {
        message: [{ path: ["newPassword"], message: "Must be at least 10 characters" }],
        error: "Bad Request",
        statusCode: 400,
      },
    };

    expect(parseApiError(error, "fallback")).toEqual({
      message: "New password: Must be at least 10 characters",
      fieldErrors: { newPassword: "Must be at least 10 characters" },
    });
  });

  it("keys nested field errors by dotted path", () => {
    const error = {
      status: 400,
      data: {
        message: [
          { path: ["firstName"], message: "Required" },
          { path: ["guardians", 0, "phone"], message: "Enter a valid Nigerian phone number" },
        ],
      },
    };

    const parsed = parseApiError(error, "fallback");

    expect(parsed.fieldErrors).toEqual({
      firstName: "Required",
      "guardians.0.phone": "Enter a valid Nigerian phone number",
    });
    expect(parsed.message).toContain("Guardian 1 phone: Enter a valid Nigerian phone number");
  });

  it("uses a plain string message as-is", () => {
    const error = { status: 409, data: { message: "Already registered as GVPS/2026/0001." } };
    expect(parseApiError(error, "fallback").message).toBe("Already registered as GVPS/2026/0001.");
  });

  it("says the server is unreachable rather than blaming the input", () => {
    expect(parseApiError({ status: "FETCH_ERROR", error: "TypeError" }, "Invalid password").message).toMatch(
      /can't reach the server/i,
    );
  });

  it("explains rate limiting", () => {
    expect(parseApiError({ status: 429, data: {} }, "fallback").message).toMatch(/too many attempts/i);
  });

  it("gives a generic server message for an unexplained 5xx", () => {
    expect(parseApiError({ status: 500, data: {} }, "fallback").message).toMatch(/went wrong on the server/i);
  });

  it("falls back for something that is not an API error at all", () => {
    expect(parseApiError(new Error("boom"), "fallback")).toEqual({ message: "fallback", fieldErrors: {} });
  });

  it("keeps a form-level issue with no path in the summary", () => {
    const error = { status: 400, data: { message: [{ path: [], message: "Only one guardian can be primary" }] } };
    expect(parseApiError(error, "fallback").message).toBe("Only one guardian can be primary");
  });
});

describe("humanizePath", () => {
  it.each([
    [["newPassword"], "New password"],
    [["dateOfBirth"], "Date of birth"],
    [["classArmId"], "Class arm"],
    [["guardians", 1, "firstName"], "Guardian 2 first name"],
  ])("%j → %s", (path, expected) => {
    expect(humanizePath(path)).toBe(expected);
  });
});

describe("scopedErrors", () => {
  it("returns one guardian's errors without the prefix", () => {
    const errors = { firstName: "Required", "guardians.0.phone": "Invalid", "guardians.1.phone": "Also invalid" };

    expect(scopedErrors(errors, "guardians.0")).toEqual({ phone: "Invalid" });
  });

  it("does not confuse guardians.1 with guardians.10", () => {
    expect(scopedErrors({ "guardians.10.phone": "x" }, "guardians.1")).toEqual({});
  });
});

describe("withoutFieldErrors", () => {
  const errors = { firstName: "Required", lastName: "Required", "guardians.0.phone": "Invalid" };

  it("removes only the named fields", () => {
    expect(withoutFieldErrors(errors, ["firstName"])).toEqual({ lastName: "Required", "guardians.0.phone": "Invalid" });
  });

  it("removes a whole prefix when the key ends in a dot", () => {
    expect(withoutFieldErrors(errors, ["guardians."])).toEqual({ firstName: "Required", lastName: "Required" });
  });
});
