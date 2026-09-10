import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * The single RTK Query API. Feature endpoints attach to it with
 * `baseApi.injectEndpoints`, one file per domain (AGENTS.md §3), so that
 * adding a domain never edits this file.
 *
 * Tags are declared here because invalidation crosses domains: recording a
 * payment invalidates a result's publication state when fee withholding is on
 * (FEATURES.md §5.10).
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
    credentials: "include",
  }),
  tagTypes: [
    "Student",
    "Guardian",
    "Enrolment",
    "Session",
    "Term",
    "ClassArm",
    "Subject",
    "Score",
    "Result",
    "Attendance",
    "Invoice",
    "Payment",
    "Ledger",
  ],
  endpoints: () => ({}),
});
