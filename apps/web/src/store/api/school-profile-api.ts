import { baseApi } from "@/store/api/base-api";

export type SchoolProfile = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  vatRatePercent: number;
};

/** The details printed on receipts, and the VAT rate applied to them (FEATURES.md §6.4). */
export const schoolProfileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchoolProfile: builder.query<SchoolProfile, void>({
      query: () => ({ url: "/school/profile" }),
      providesTags: ["School"],
    }),
    updateSchoolProfile: builder.mutation<SchoolProfile, SchoolProfile>({
      query: (body) => ({ url: "/school/profile", method: "PUT", body }),
      invalidatesTags: ["School"],
    }),
  }),
});

export const { useGetSchoolProfileQuery, useUpdateSchoolProfileMutation } = schoolProfileApi;
