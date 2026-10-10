import { baseApi } from "@/store/api/base-api";

export type BroadsheetCell = { total: number; maxTotal: number; grade: { letter: string; descriptor: string } | null };
export type BroadsheetRow = {
  studentId: string;
  name: string;
  admissionNo: string;
  scores: (BroadsheetCell | null)[];
  total: number;
  maxTotal: number;
  average: number;
  position: number;
};
export type Broadsheet = {
  classLabel: string;
  term: { name: string; sequence: number };
  subjects: { subjectId: string; subjectName: string }[];
  rows: BroadsheetRow[];
  classSize: number;
};

/** FEATURES.md §5.9 — the whole arm's score matrix, read-only, computed from whatever subjects are published so far. */
export const broadsheetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBroadsheet: builder.query<Broadsheet, { termId: string; classArmId: string }>({
      query: ({ termId, classArmId }) => ({ url: `/results/broadsheet/terms/${termId}/arms/${classArmId}` }),
      providesTags: ["ResultSheet"],
    }),
  }),
});

export const { useGetBroadsheetQuery } = broadsheetApi;
