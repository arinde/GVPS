import { baseApi } from "@/store/api/base-api";

export type ParentAccountStatus = {
  phone: string;
  /** How many students list this number on a guardian record. */
  children: number;
  account: {
    mustChangePassword: boolean;
    lastLoginAt: string | null;
    lockedUntil: string | null;
    createdAt: string;
  } | null;
};

/** Returned once when a login is issued or reset: the temporary password for the slip. */
export type IssuedParentLogin = { phone: string; children: number; temporaryPassword: string };

/** The superadmin's side of family-portal logins, keyed by phone number. */
export const parentAccountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getParentAccountStatus: builder.query<ParentAccountStatus, string>({
      query: (phone) => ({ url: "/parent-accounts", params: { phone } }),
      providesTags: (_result, _error, phone) => [{ type: "ParentAccount", id: phone }],
    }),
    issueParentLogin: builder.mutation<IssuedParentLogin, string>({
      query: (phone) => ({ url: "/parent-accounts", method: "POST", body: { phone } }),
      invalidatesTags: (_result, _error, phone) => [{ type: "ParentAccount", id: phone }, "Dashboard"],
    }),
    resetParentPassword: builder.mutation<IssuedParentLogin, string>({
      query: (phone) => ({ url: "/parent-accounts/reset-password", method: "POST", body: { phone } }),
      invalidatesTags: (_result, _error, phone) => [{ type: "ParentAccount", id: phone }, "Dashboard"],
    }),
  }),
});

export const { useGetParentAccountStatusQuery, useIssueParentLoginMutation, useResetParentPasswordMutation } =
  parentAccountsApi;
