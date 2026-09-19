import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { portalApi } from "@/store/api/portal-api";
import type { Credentials } from "@/store/slices/auth-actions";
import { clearPortalCredentials, setPortalCredentials } from "@/store/slices/portal-auth-actions";

/**
 * The signed-in parent's session: in memory only, like the staff session
 * (auth-slice.ts), with the refresh token in its own httpOnly cookie.
 */
type PortalAuthState = { accessToken: string | null; mustChangePassword: boolean };

const initialState: PortalAuthState = { accessToken: null, mustChangePassword: false };

function store(state: PortalAuthState, credentials: Credentials) {
  state.accessToken = credentials.accessToken;
  state.mustChangePassword = credentials.mustChangePassword;
}

const portalAuthSlice = createSlice({
  name: "portalAuth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(setPortalCredentials, (state, action) => store(state, action.payload))
      .addCase(clearPortalCredentials, () => initialState)
      // Stored in the action that ends the restore, so "restored" and
      // "signed in" never disagree for a render (the staff slice's lesson).
      .addMatcher(portalApi.endpoints.portalRefreshSession.matchFulfilled, (state, action) =>
        store(state, action.payload),
      )
      .addMatcher(portalApi.endpoints.portalLogin.matchFulfilled, (state, action) => store(state, action.payload));
  },
});

export const portalAuthReducer = portalAuthSlice.reducer;

export const selectPortalAccessToken = (state: RootState) => state.portalAuth.accessToken;
export const selectPortalMustChangePassword = (state: RootState) => state.portalAuth.mustChangePassword;
