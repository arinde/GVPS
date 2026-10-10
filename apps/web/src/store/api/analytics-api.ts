import { baseApi } from "@/store/api/base-api";

export type EnrolmentAnalytics = {
  session: string;
  total: number;
  byLevel: { name: string; count: number }[];
  byArm: { name: string; count: number }[];
  bySex: { sex: string; count: number }[];
};

export type AttendanceAnalytics = {
  term: string;
  daily: { date: string; percentPresent: number }[];
  byArm: { name: string; percentPresent: number }[];
};

export type AcademicAnalytics = {
  term: string;
  bySubject: { name: string; averagePercent: number }[];
  gradeDistribution: { letter: string; count: number }[];
};

export type FinancialAnalytics = {
  term: string;
  expectedKobo: number;
  collectedKobo: number;
  outstandingKobo: number;
};

/** FEATURES.md §10 — role-gated analytics cards; a 403 here just means that card doesn't render for this role. */
export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnrolmentAnalytics: builder.query<EnrolmentAnalytics, void>({
      query: () => ({ url: "/analytics/enrolment" }),
      providesTags: ["Dashboard"],
    }),
    getAcademicAnalytics: builder.query<AcademicAnalytics, void>({
      query: () => ({ url: "/analytics/academic" }),
      providesTags: ["Dashboard"],
    }),
    getAttendanceAnalytics: builder.query<AttendanceAnalytics, void>({
      query: () => ({ url: "/analytics/attendance" }),
      providesTags: ["Dashboard"],
    }),
    getFinancialAnalytics: builder.query<FinancialAnalytics, void>({
      query: () => ({ url: "/analytics/financial" }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetEnrolmentAnalyticsQuery,
  useGetAcademicAnalyticsQuery,
  useGetAttendanceAnalyticsQuery,
  useGetFinancialAnalyticsQuery,
} = analyticsApi;
