import { createAction } from "@reduxjs/toolkit";
import type { Credentials } from "@/store/slices/auth-actions";

// The family portal's session, kept apart from the staff one so a parent and
// a staff member on one browser never share a token. In their own module for
// the same import-cycle reason as auth-actions.ts.
export const setPortalCredentials = createAction<Credentials>("portalAuth/setCredentials");
export const clearPortalCredentials = createAction("portalAuth/clearCredentials");
