import { describe, expect, it } from "vitest";
import { decodeAccessToken } from "@/lib/decode-access-token";

function fakeToken(payload: object): string {
  const base64url = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `header.${base64url}.signature`;
}

describe("decodeAccessToken", () => {
  it("decodes the payload segment", () => {
    const token = fakeToken({ sub: "staff-1", roles: ["SUPERADMIN"], mustChangePassword: false });
    expect(decodeAccessToken(token)).toEqual({ sub: "staff-1", roles: ["SUPERADMIN"], mustChangePassword: false });
  });

  it("returns null for a malformed token", () => {
    expect(decodeAccessToken("not-a-jwt")).toBeNull();
  });

  it("returns null when the payload isn't valid JSON", () => {
    expect(decodeAccessToken("header.###.signature")).toBeNull();
  });
});
