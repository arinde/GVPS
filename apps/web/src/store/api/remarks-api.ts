import { baseApi } from "@/store/api/base-api";

export type TraitGroups = { affective: readonly string[]; psychomotor: readonly string[] };
export type RemarkStudent = {
  studentId: string;
  name: string;
  admissionNo: string;
  formComment: string | null;
  principalComment: string | null;
  traits: Record<string, number> | null;
  locked: boolean;
};
export type RemarkList = { traitGroups: TraitGroups; students: RemarkStudent[] };
export type SaveRemarkRequest = {
  termId: string;
  studentId: string;
  formComment?: string | null;
  principalComment?: string | null;
  traits?: Record<string, number> | null;
};

/** FEATURES.md §5.6–5.7 — the form teacher's comment and traits, and the principal's comment. */
export const remarksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listRemarks: builder.query<RemarkList, { termId: string; classArmId: string }>({
      query: ({ termId, classArmId }) => ({ url: `/assessment/remarks/terms/${termId}/arms/${classArmId}` }),
      providesTags: ["ResultSheet"],
    }),
    saveRemark: builder.mutation<unknown, SaveRemarkRequest>({
      query: ({ termId, studentId, ...body }) => ({
        url: `/assessment/remarks/terms/${termId}/students/${studentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ResultSheet"],
    }),
  }),
});

export const { useListRemarksQuery, useSaveRemarkMutation } = remarksApi;
