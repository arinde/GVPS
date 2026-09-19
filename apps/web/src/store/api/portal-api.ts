import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";
import type { ChangePasswordRequest, TokenResponse } from "@/store/api/auth-api";
import type { Credentials } from "@/store/slices/auth-actions";
import { clearPortalCredentials, setPortalCredentials } from "@/store/slices/portal-auth-actions";

type ClassRef = { id: string; name: string; classLevel: { name: string } };

export type PortalMe = { school: { name: string }; phone: string; names: string[] };

export type PortalChild = {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  admissionNo: string;
  photo: { updatedAt: string } | null;
  enrolments: { stream: string | null; session: { name: string }; classArm: ClassRef }[];
};

export type PortalChildDetail = Omit<PortalChild, "enrolments"> & {
  admissionYear: number;
  dateOfBirth: string;
  sex: "MALE" | "FEMALE";
  stateOfOrigin: string | null;
  lga: string | null;
  address: string | null;
  bloodGroup: string | null;
  medicalNote: string | null;
  admittedIntoLevel: { name: string };
  guardians: {
    relationship: "FATHER" | "MOTHER" | "GUARDIAN";
    isPrimary: boolean;
    guardian: { firstName: string; lastName: string; phone: string };
  }[];
  enrolments: {
    id: string;
    status: string;
    stream: "SCIENCE" | "ARTS" | "COMMERCIAL" | null;
    session: { id: string; name: string };
    classArm: ClassRef;
  }[];
  formTeacher: { firstName: string | null; lastName: string | null; otherNames: string | null } | null;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).portalAuth.accessToken;
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    return headers;
  },
});

/** One silent refresh on a 401, as the staff API does (base-api.ts), against the portal's own cookie. */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refreshed = await rawBaseQuery({ url: "/portal/auth/refresh", method: "POST" }, api, extraOptions);
    if (refreshed.data) {
      api.dispatch(setPortalCredentials(refreshed.data as Credentials));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearPortalCredentials());
    }
  }
  return result;
};

/**
 * The family portal's API: parent sign-in and read-only views of their own
 * children. A separate RTK Query API from the staff one because it carries a
 * different token; the server refuses each token on the other's routes.
 */
export const portalApi = createApi({
  reducerPath: "portalApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["PortalChildren"],
  endpoints: (builder) => ({
    portalLogin: builder.mutation<TokenResponse, { phone: string; password: string }>({
      query: (body) => ({ url: "/portal/auth/login", method: "POST", body }),
    }),
    // A query so the portal shell restores the session on mount without an effect (see auth-api.ts).
    portalRefreshSession: builder.query<TokenResponse, void>({
      query: () => ({ url: "/portal/auth/refresh", method: "POST" }),
    }),
    portalLogout: builder.mutation<void, void>({
      query: () => ({ url: "/portal/auth/logout", method: "POST" }),
    }),
    portalChangePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: "/portal/auth/change-password", method: "POST", body }),
    }),
    getPortalMe: builder.query<PortalMe, void>({
      query: () => ({ url: "/portal/me" }),
    }),
    listPortalChildren: builder.query<PortalChild[], void>({
      query: () => ({ url: "/portal/children" }),
      providesTags: ["PortalChildren"],
    }),
    getPortalChild: builder.query<PortalChildDetail, string>({
      query: (studentId) => ({ url: `/portal/children/${studentId}` }),
      providesTags: ["PortalChildren"],
    }),
    // Keyed on the photo's updatedAt too, so a new photo is never served stale.
    getPortalChildPhoto: builder.query<{ dataUrl: string }, { studentId: string; version: string }>({
      query: ({ studentId }) => ({ url: `/portal/children/${studentId}/photo` }),
    }),
  }),
});

export const {
  usePortalLoginMutation,
  usePortalRefreshSessionQuery,
  usePortalLogoutMutation,
  usePortalChangePasswordMutation,
  useGetPortalMeQuery,
  useListPortalChildrenQuery,
  useGetPortalChildQuery,
  useGetPortalChildPhotoQuery,
} = portalApi;
