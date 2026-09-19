import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";
import { clearCredentials, setCredentials } from "@/store/slices/auth-slice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return headers;
  },
});

/**
 * Access tokens are short-lived by design (auth module, FEATURES.md §1.2).
 * A 401 triggers exactly one silent refresh attempt against the httpOnly
 * refresh cookie before falling back to logging the session out — this is
 * what keeps a 15-minute token from forcing a re-login every 15 minutes.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);

    if (refreshResult.data) {
      api.dispatch(setCredentials(refreshResult.data as { accessToken: string; mustChangePassword: boolean }));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

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
  baseQuery: baseQueryWithReauth,
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
    "Staff",
    "ClassAssignment",
    "Access",
  ],
  endpoints: () => ({}),
});
