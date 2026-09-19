import { createAction } from "@reduxjs/toolkit";

export type Credentials = { accessToken: string; mustChangePassword: boolean };

// In their own module so base-api.ts can dispatch them without importing the
// slice, which itself listens to the auth API — importing each other would be
// a cycle.
export const setCredentials = createAction<Credentials>("auth/setCredentials");
export const clearCredentials = createAction("auth/clearCredentials");
