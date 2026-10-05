import { baseApi } from "@/store/api/base-api";

export type ReportCardSubject = {
  subjectName: string;
  total: number;
  maxTotal: number;
  grade: { letter: string; descriptor: string } | null;
  position: number;
  classSize: number;
  classAverage: number;
  highest: number;
  lowest: number;
  scores: { componentName: string; maxScore: number; value: number }[];
};

/** FEATURES.md §5.8 — a frozen report card. Read as it was published, never recomputed. */
export type ReportCard = {
  term: { name: string; sequence: number; timesSchoolOpened: number | null };
  classLabel: string;
  student: { name: string; admissionNo: string };
  subjects: ReportCardSubject[];
  totals: { total: number; maxTotal: number; average: number; position: number; classSize: number };
  cumulative: { average: number; termsCounted: number };
  promotion: { threshold: number; recommended: boolean } | null;
  remarks: { formComment: string | null; principalComment: string | null; traits: Record<string, number> | null };
  feeBalanceKobo: number;
  publishedAt: string;
};

export const reportCardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReportCard: builder.query<ReportCard, { termId: string; studentId: string }>({
      query: ({ termId, studentId }) => ({ url: `/results/report-cards/terms/${termId}/students/${studentId}` }),
      providesTags: ["ResultSheet"],
    }),
  }),
});

export const { useGetReportCardQuery } = reportCardApi;
