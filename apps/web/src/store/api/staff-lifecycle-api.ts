import { baseApi } from "@/store/api/base-api";

export type OnboardingStep = { key: string; label: string; required: boolean; done: boolean };
export type StaffOnboarding = { steps: OnboardingStep[]; complete: boolean };
export type ResetPasswordResult = { staffId: string; temporaryPassword: string };

/** Onboarding checklist, password reset and deletion for one staff account (FEATURES.md §1.6). */
export const staffLifecycleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaffOnboarding: builder.query<StaffOnboarding, string>({
      query: (staffId) => ({ url: `/auth/staff/${staffId}/onboarding` }),
      providesTags: ["Staff", "SubjectAssignment", "ClassAssignment"],
    }),
    resetStaffPassword: builder.mutation<ResetPasswordResult, string>({
      query: (staffId) => ({ url: `/auth/staff/${staffId}/reset-password`, method: "POST" }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation<void, { staffId: string; reason: string }>({
      query: ({ staffId, reason }) => ({ url: `/auth/staff/${staffId}`, method: "DELETE", body: { reason } }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const { useGetStaffOnboardingQuery, useResetStaffPasswordMutation, useDeleteStaffMutation } = staffLifecycleApi;
