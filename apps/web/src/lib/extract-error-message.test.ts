import { describe, expect, it } from "vitest";
import { extractErrorMessage } from "@/lib/extract-error-message";

describe("extractErrorMessage", () => {
  it("returns the fallback for a non-RTK-Query error", () => {
    expect(extractErrorMessage(new Error("boom"), "fallback")).toBe("fallback");
  });

  it("returns the fallback when the error has no message field", () => {
    expect(extractErrorMessage({ status: 500, data: {} }, "fallback")).toBe("fallback");
  });

  it("extracts a string message from the error body", () => {
    expect(extractErrorMessage({ status: 401, data: { message: "Invalid credentials." } }, "fallback")).toBe(
      "Invalid credentials.",
    );
  });

  it("joins an array of string messages", () => {
    const error = { status: 400, data: { message: ["Field A is required.", "Field B is required."] } };
    expect(extractErrorMessage(error, "fallback")).toBe("Field A is required. Field B is required.");
  });

  it("falls back when the message array holds non-string entries", () => {
    const error = { status: 400, data: { message: [{ path: ["email"], message: "Invalid" }] } };
    expect(extractErrorMessage(error, "fallback")).toBe("fallback");
  });
});
