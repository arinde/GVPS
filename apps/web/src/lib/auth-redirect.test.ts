import { describe, expect, it } from "vitest";
import { authRedirect, type AuthRedirectInput } from "@/lib/auth-redirect";

function input(overrides: Partial<AuthRedirectInput>): AuthRedirectInput {
  return { pathname: "/", isRestoringSession: false, isSignedIn: false, mustChangePassword: false, ...overrides };
}

describe("authRedirect", () => {
  it("sends a signed-out visitor on the home page to sign in", () => {
    expect(authRedirect(input({ pathname: "/" }))).toBe("/login");
  });

  it("sends a signed-out visitor on any protected page to sign in", () => {
    expect(authRedirect(input({ pathname: "/students/new" }))).toBe("/login");
  });

  it("leaves a signed-out visitor on the login page alone", () => {
    expect(authRedirect(input({ pathname: "/login" }))).toBeNull();
  });

  it("does not decide anything while the session is still being restored", () => {
    // Otherwise a signed-in user is bounced to /login on every refresh, before
    // the refresh cookie has had a chance to produce an access token.
    expect(authRedirect(input({ pathname: "/students", isRestoringSession: true }))).toBeNull();
  });

  it("funnels a temporary-password user to change it from anywhere", () => {
    expect(authRedirect(input({ pathname: "/students", isSignedIn: true, mustChangePassword: true }))).toBe(
      "/change-password",
    );
  });

  it("lets a temporary-password user stay on the change page", () => {
    expect(
      authRedirect(input({ pathname: "/change-password", isSignedIn: true, mustChangePassword: true })),
    ).toBeNull();
  });

  it("sends a signed-out visitor away from the change-password page", () => {
    expect(authRedirect(input({ pathname: "/change-password" }))).toBe("/login");
  });

  it("moves a signed-in user off the login page", () => {
    expect(authRedirect(input({ pathname: "/login", isSignedIn: true }))).toBe("/");
  });

  it("leaves a signed-in user on a normal page alone", () => {
    expect(authRedirect(input({ pathname: "/students", isSignedIn: true }))).toBeNull();
  });
});
