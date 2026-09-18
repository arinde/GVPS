import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { notify } from "@/lib/notify";

describe("notify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a success with the default duration", () => {
    notify.success("Student registered");

    expect(toast.success).toHaveBeenCalledWith("Student registered", { description: undefined, duration: 4000 });
  });

  it("lets a caller keep an important success up longer", () => {
    notify.success("Registered", { description: "GVPS/2026/0001", durationMs: 12000 });

    expect(toast.success).toHaveBeenCalledWith("Registered", { description: "GVPS/2026/0001", duration: 12000 });
  });

  it("turns an API error into readable text, never raw JSON", () => {
    notify.error({ status: 409, data: { message: "Already registered as GVPS/2026/0001." } }, "fallback");

    expect(toast.error).toHaveBeenCalledWith("Already registered as GVPS/2026/0001.", expect.anything());
  });

  it("points at the fields when the error has field detail, and returns it", () => {
    const parsed = notify.error(
      { status: 400, data: { message: [{ path: ["newPassword"], message: "Use at least 10 characters" }] } },
      "fallback",
    );

    expect(toast.error).toHaveBeenCalledWith("Please correct the highlighted fields.", expect.anything());
    expect(parsed.fieldErrors).toEqual({ newPassword: "Use at least 10 characters" });
  });

  it("says the server is unreachable on a network failure", () => {
    notify.error({ status: "FETCH_ERROR", error: "TypeError" }, "Invalid email or password.");

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/can't reach the server/i), expect.anything());
  });

  it("keeps errors up longer than successes", () => {
    notify.error({ status: 500, data: {} }, "fallback");

    expect(toast.error).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ duration: 8000 }));
  });
});
