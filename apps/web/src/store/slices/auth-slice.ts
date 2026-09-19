import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { authApi } from "@/store/api/auth-api";
import { clearCredentials, setCredentials, type Credentials } from "@/store/slices/auth-actions";

export { clearCredentials, setCredentials };

/**
 * Cross-cutting session state (AGENTS.md §3) — the access token and whether
 * a password change is required. Deliberately in-memory only, never
 * localStorage: an httpOnly cookie already carries the refresh token, and
 * keeping the access token out of any storage an XSS payload could read is
 * the point of that design (auth module, FEATURES.md §1.2).
 */
type AuthState = {
  accessToken: string | null;
  mustChangePassword: boolean;
};

const initialState: AuthState = { accessToken: null, mustChangePassword: false };

function store(state: AuthState, credentials: Credentials) {
  state.accessToken = credentials.accessToken;
  state.mustChangePassword = credentials.mustChangePassword;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(setCredentials, (state, action) => store(state, action.payload))
      .addCase(clearCredentials, (state) => {
        state.accessToken = null;
        state.mustChangePassword = false;
      })
      // The boot-time session restore stores its token in the same action
      // that marks the request finished. Copying it across in a later effect
      // left one render where the restore was "done" but nobody was signed
      // in, and the app redirected a signed-in user to /login.
      .addMatcher(authApi.endpoints.refreshSession.matchFulfilled, (state, action) => store(state, action.payload));
  },
});

export const authReducer = authSlice.reducer;

export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectMustChangePassword = (state: RootState) => state.auth.mustChangePassword;
export const selectIsAuthenticated = (state: RootState) => state.auth.accessToken !== null;
