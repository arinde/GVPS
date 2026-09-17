import { baseApi } from "@/store/api/base-api";

export type LoginRequest = { email: string; password: string };
export type TokenResponse = { accessToken: string; mustChangePassword: boolean };
export type ChangePasswordRequest = { currentPassword: string; newPassword: string };
export type CreateStaffRequest = { email: string; roles: string[] };
export type CreateStaffResponse = { staffId: string; temporaryPassword: string };

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<TokenResponse, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),

    // Modelled as a query (not a mutation) purely so a component can trigger
    // it declaratively on mount via the auto-generated hook — the point is
    // boot-time session hydration from the httpOnly refresh cookie, with no
    // useEffect needed to kick it off (AGENTS.md §2).
    refreshSession: builder.query<TokenResponse, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),

    changePassword: builder.mutation<void, ChangePasswordRequest>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),

    createStaff: builder.mutation<CreateStaffResponse, CreateStaffRequest>({
      query: (body) => ({ url: "/auth/staff", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshSessionQuery,
  useLogoutMutation,
  useChangePasswordMutation,
  useCreateStaffMutation,
} = authApi;
