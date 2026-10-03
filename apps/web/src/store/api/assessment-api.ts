import { baseApi } from "@/store/api/base-api";

export type GradeBand = { minScore: number; maxScore: number; letter: string; descriptor: string; remark: string };
export type GradingScale = { section: string; passMark: number; promotionThreshold: number; bands: GradeBand[] };

/** §5.1/§5.2 assessment configuration — read side only, for now (Block 1). */
export const assessmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGradingScale: builder.query<GradingScale | null, string>({
      query: (section) => ({ url: "/assessment/grading-scales", params: { section } }),
      providesTags: ["GradingScale"],
    }),
  }),
});

export const { useGetGradingScaleQuery } = assessmentApi;
