import { baseApi } from "@/store/api/base-api";

export type SubjectResultScore = { componentId: string; componentName: string; maxScore: number; value: number };
export type SubjectResult = {
  subjectId: string;
  subjectName: string;
  scores: SubjectResultScore[];
  total: number;
  maxTotal: number;
  grade: { letter: string; descriptor: string } | null;
};
export type StudentResults = { term: { id: string; name: string } | null; subjects: SubjectResult[] };

/** A live read of a student's current scores — not the frozen computation FEATURES.md §5.5 produces at approval. */
export const resultsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudentResults: builder.query<StudentResults, string>({
      query: (studentId) => ({ url: `/results/students/${studentId}` }),
      providesTags: ["Score"],
    }),
  }),
});

export const { useGetStudentResultsQuery } = resultsApi;
