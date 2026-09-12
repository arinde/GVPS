import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ accessToken: string; mustChangePassword: boolean }>) => {
      state.accessToken = action.payload.accessToken;
      state.mustChangePassword = action.payload.mustChangePassword;
    },
    clearCredentials: (state) => {
      state.accessToken = null;
      state.mustChangePassword = false;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectMustChangePassword = (state: RootState) => state.auth.mustChangePassword;
export const selectIsAuthenticated = (state: RootState) => state.auth.accessToken !== null;
