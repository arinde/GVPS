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

  it("signs the user in from the session-restore response itself, in one step", () => {
    // The shape RTK Query dispatches when refreshSession succeeds. Storing the
    // token in this same action is what stops a signed-in user being sent to
    // /login on page reload (see auth-slice.ts).
    const fulfilled = {
      type: "api/executeQuery/fulfilled",
      payload: { accessToken: "restored", mustChangePassword: false },
      meta: {
        arg: { type: "query", endpointName: "refreshSession", originalArgs: undefined, queryCacheKey: "x" },
        requestId: "r1",
        requestStatus: "fulfilled",
        fulfilledTimeStamp: 1,
        baseQueryMeta: {},
      },
    };

    const state = authReducer(undefined, fulfilled);

    expect(state.accessToken).toBe("restored");
  });

  it("ignores other endpoints' responses", () => {
    const otherEndpoint = {
      type: "api/executeQuery/fulfilled",
      payload: { accessToken: "not-a-session", mustChangePassword: false },
      meta: {
        arg: { type: "query", endpointName: "listStudents", originalArgs: undefined, queryCacheKey: "y" },
        requestId: "r2",
        requestStatus: "fulfilled",
        fulfilledTimeStamp: 1,
        baseQueryMeta: {},
      },
    };

    expect(authReducer(undefined, otherEndpoint).accessToken).toBeNull();
  });
});
