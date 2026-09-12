import { describe, expect, it } from "vitest";
import { authReducer, clearCredentials, setCredentials } from "@/store/slices/auth-slice";

describe("authReducer", () => {
  it("starts logged out", () => {
    const state = authReducer(undefined, { type: "@@INIT" });
    expect(state).toEqual({ accessToken: null, mustChangePassword: false });
  });

  it("stores the token and mustChangePassword flag on setCredentials", () => {
    const state = authReducer(undefined, setCredentials({ accessToken: "abc", mustChangePassword: true }));
    expect(state).toEqual({ accessToken: "abc", mustChangePassword: true });
  });

  it("clears both fields on clearCredentials", () => {
    const loggedIn = authReducer(undefined, setCredentials({ accessToken: "abc", mustChangePassword: false }));
    const state = authReducer(loggedIn, clearCredentials());
    expect(state).toEqual({ accessToken: null, mustChangePassword: false });
  });
});
