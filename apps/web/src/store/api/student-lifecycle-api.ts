import { baseApi } from "@/store/api/base-api";

/** Soft-deletes a student: they leave every list and their enrolment closes; history stays. */
export const studentLifecycleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    deleteStudent: builder.mutation<void, { studentId: string; reason: string }>({
      query: ({ studentId, reason }) => ({ url: `/students/${studentId}`, method: "DELETE", body: { reason } }),
      invalidatesTags: ["Student", "Enrolment"],
    }),
  }),
});

export const { useDeleteStudentMutation } = studentLifecycleApi;
